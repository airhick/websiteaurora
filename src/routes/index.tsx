import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle } = useAuthStore((state) => state.auth)

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, loading, navigate])

  const handleTrial = async () => {
    // Trial: Sign in with Google
    const { error } = await signInWithGoogle()
    if (error) {
      alert(`Unable to sign in: ${error.message || 'Please configure Supabase in your .env.local file'}`)
    }
  }

  const handleCompanyLogin = () => {
    // Company Login: Navigate to login page which shows email/password form
    navigate({ to: '/login' })
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // If user is authenticated, they will be redirected by useEffect
  // Show landing page for non-authenticated users
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted">
      {/* Top Navigation Bar */}
      <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-end gap-4 px-4">
          <Button
            variant="outline"
            onClick={handleTrial}
            className="hidden sm:inline-flex"
          >
            Trial
          </Button>
          <Button
            onClick={handleCompanyLogin}
            className="hidden sm:inline-flex"
          >
            Company Login
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <img 
              src="/logos/aurora-logo.png" 
              alt="Aurora Logo" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Aurora - AI Receptionist
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Never miss a call again with Aurora AI Receptionist - 24/7 intelligent call handling
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={handleTrial} variant="outline" className="text-lg">
              Start Trial
            </Button>
            <Button size="lg" onClick={handleCompanyLogin} className="text-lg">
              Company Login
            </Button>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">24/7 Call Answering</h3>
              <p className="text-sm text-muted-foreground">
                Your AI receptionist never sleeps
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Smart Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Automatically book appointments
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">FAQ Handling</h3>
              <p className="text-sm text-muted-foreground">
                Answer common questions instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

