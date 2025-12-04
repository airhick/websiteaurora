import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { fetchVAPICalls, type VAPICall } from '@/lib/vapi'
import { toast } from 'sonner'

export function useVAPICalls() {
  const user = useAuthStore((state) => state.auth.user)
  const [calls, setCalls] = useState<VAPICall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = user?.user_metadata?.vapi_api_key || localStorage.getItem('vapi_private_key') || ''

  const refreshCalls = useCallback(async () => {
    if (!apiKey) {
      setCalls([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchVAPICalls(apiKey)
      setCalls(data)
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to fetch calls: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    refreshCalls()
    // Refresh every 30 seconds
    const interval = setInterval(refreshCalls, 30000)
    return () => clearInterval(interval)
  }, [refreshCalls])

  return {
    calls,
    loading,
    error,
    refreshCalls,
    hasApiKey: !!apiKey
  }
}

