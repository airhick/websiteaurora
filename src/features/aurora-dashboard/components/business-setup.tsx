import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { Mail, Lock } from 'lucide-react'
import { authenticateWithCustomersTable, createAuthUserForCustomer } from '@/lib/custom-auth'
import { supabase } from '@/lib/supabase'

interface BusinessSetupProps {
  onComplete: () => void
}

export function BusinessSetup({ onComplete }: BusinessSetupProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { setSession } = useAuthStore((state) => state.auth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSetupError('')
    setIsLoading(true)

    try {
      if (!email || !password) {
        setSetupError('Please enter both email and password')
        setIsLoading(false)
        return
      }

      let data, error

      if (isSignUp) {
        // Sign up with email and password
        const result = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        data = result.data
        error = result.error

        if (error) {
          // Handle specific sign-up errors
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in instead.')
          }
          throw new Error(error.message || 'Failed to create account')
        }

        if (data.session) {
          setSession(data.session)
          toast.success('Account created successfully!')
          onComplete()
        } else {
          // Email confirmation required
          toast.success('Please check your email to confirm your account')
          setSetupError('Please check your email to confirm your account before signing in.')
        }
      } else {
        // Sign in: Check credentials against customers table
        const { customer, error: authError } = await authenticateWithCustomersTable(
          email.trim(),
          password
        )

        if (authError || !customer) {
          throw new Error(authError || 'Invalid email or password')
        }

        // Create session for the authenticated customer (this also sets the cookie)
        const { session, error: sessionError } = await createAuthUserForCustomer(customer)

        if (sessionError || !session) {
          throw new Error(sessionError || 'Failed to create session')
      }

        // Set the session (cookie is already set by createAuthUserForCustomer)
        setSession(session)
        toast.success('Welcome back!')
        onComplete()
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setSetupError(error.message || 'Failed to authenticate. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img 
              src="/logos/aurora-logo.png" 
              alt="Aurora Logo" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <CardTitle className="text-center">Welcome to Aurora! 🎉</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your AI receptionist dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                required
                  disabled={isLoading}
                  className="pl-10"
              />
              </div>
            </div>

            {setupError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{setupError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? '🔐 Create Account' : '🔐 Sign In'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setSetupError('')
                }}
                className="text-sm text-muted-foreground hover:text-foreground underline"
                disabled={isLoading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in instead' 
                  : "Don't have an account? Sign up"}
              </button>
            </div>

            <Alert>
              <AlertTitle>Secure Access</AlertTitle>
              <AlertDescription>
                Your credentials are securely verified against our database. 
                All data is encrypted and protected.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

