import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createCustomer } from '@/lib/api'
import { supabase } from '@/lib/supabase'

/**
 * Hook to sync authenticated user with the customers table
 * Only syncs for Supabase Auth users, not custom auth users
 */
export function useCustomerSync() {
  const { user, session } = useAuthStore((state) => state.auth)

  useEffect(() => {
    if (!user) return

    // Delay sync to not block initial page load
    const timeout = setTimeout(() => {
      const syncCustomer = async () => {
        try {
          // Check if this is a custom auth session (not Supabase Auth)
          const { data: { session: supabaseSession } } = await supabase.auth.getSession()
          
          // If no Supabase session but we have a user, it's custom auth
          // Custom auth users already have customer records, so skip sync
          if (!supabaseSession && session) {
            console.log('Custom auth session detected. Skipping customer sync.')
            return
          }

          const userEmail = user.email
          const userMetadata = user.user_metadata || {}

          if (!userEmail) {
            console.error('No email found in user session')
            return
          }

          const fullName = userMetadata.full_name || userMetadata.name || ''
          const firstName =
            userMetadata.first_name ||
            (fullName ? fullName.split(' ')[0] : null) ||
            null
          const lastName =
            userMetadata.last_name ||
            (fullName ? fullName.split(' ').slice(1).join(' ') : null) ||
            null

          const result = await createCustomer({
            email: userEmail,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            phone: (userMetadata as any).phone || undefined,
            title: (userMetadata as any).title || undefined,
          })

          if (result) {
          console.log('Customer record synced successfully')
          }
        } catch (error) {
          // Only log errors that aren't "skipped" messages
          if (error instanceof Error && !error.message.includes('Skipping')) {
          console.error('Failed to sync customer record:', error)
          }
        }
      }

      syncCustomer()
    }, 2000) // Delay by 2 seconds to let critical data load first

    return () => clearTimeout(timeout)
  }, [user, session])
}

