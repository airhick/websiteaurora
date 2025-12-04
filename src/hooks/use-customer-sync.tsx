import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createCustomer } from '@/lib/api'

/**
 * Hook to sync authenticated user with the customers table
 */
export function useCustomerSync() {
  const { user } = useAuthStore((state) => state.auth)

  useEffect(() => {
    if (!user) return

    const syncCustomer = async () => {
      try {
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

        await createCustomer({
          email: userEmail,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          phone: (userMetadata as any).phone || undefined,
          title: (userMetadata as any).title || undefined,
        })

        console.log('Customer record synced successfully')
      } catch (error) {
        console.error('Failed to sync customer record:', error)
      }
    }

    syncCustomer()
  }, [user])
}

