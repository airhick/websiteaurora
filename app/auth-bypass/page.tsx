// Temporary Auth Bypass for Testing
// This allows you to test the dashboard without authentication

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthBypass() {
  const [bypassEnabled, setBypassEnabled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if bypass is enabled via URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const bypass = urlParams.get('bypass')
    
    if (bypass === 'true') {
      setBypassEnabled(true)
      // Redirect to dashboard
      router.push('/dashboard?bypass=true')
    }
  }, [router])

  const enableBypass = () => {
    // Set bypass flag in localStorage
    localStorage.setItem('auth-bypass', 'true')
    // Redirect to dashboard
    router.push('/dashboard?bypass=true')
  }

  if (bypassEnabled) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-900 text-2xl font-bold mb-4">
            🔓 Auth Bypass Enabled
          </div>
          <div className="text-gray-600 mb-6">
            Redirecting to dashboard...
          </div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-gray-900 text-2xl font-bold mb-4">
          🔐 Authentication Required
        </div>
        <div className="text-gray-600 mb-6">
          To access the dashboard, you need to either:
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Option 1: Disable Email Confirmation</h3>
            <p className="text-blue-700 text-sm mb-3">
              Go to Supabase Dashboard → Authentication → Settings → Disable "Enable email confirmations"
            </p>
            <p className="text-blue-700 text-sm">
              Then use: <strong>test@aurora.com</strong> / <strong>testpassword123</strong>
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">Option 2: Check Email</h3>
            <p className="text-orange-700 text-sm mb-3">
              Check your email for confirmation link from Supabase
            </p>
            <p className="text-orange-700 text-sm">
              Click the link to confirm your account
            </p>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">Option 3: Test Mode (Temporary)</h3>
            <p className="text-red-700 text-sm mb-3">
              Enable temporary bypass for testing (not recommended for production)
            </p>
            <button
              onClick={enableBypass}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Enable Test Mode
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <strong>Recommended:</strong> Use Option 1 to disable email confirmation in Supabase
        </div>
      </div>
    </div>
  )
}
