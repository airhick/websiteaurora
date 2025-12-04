import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.auth.setSession)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate({ to: '/' })
          return
        }

        if (data.session) {
          setSession(data.session)
          // Redirect to dashboard
          navigate({ to: '/dashboard' })
        } else {
          // No session, redirect to home
          navigate({ to: '/' })
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        navigate({ to: '/' })
      }
    }

    handleCallback()
  }, [navigate, setSession])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-lg">Completing sign in...</p>
      </div>
    </div>
  )
}

