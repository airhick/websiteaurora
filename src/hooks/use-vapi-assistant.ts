import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { fetchVAPIAssistants, fetchVAPIAssistant, type VAPIAssistant } from '@/lib/vapi'

export function useVAPIAssistant(assistantId?: string) {
  const user = useAuthStore((state) => state.auth.user)
  const [assistant, setAssistant] = useState<VAPIAssistant | null>(null)
  const [assistants, setAssistants] = useState<VAPIAssistant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = user?.user_metadata?.vapi_api_key || localStorage.getItem('vapi_private_key') || ''

  const fetchAssistant = useCallback(async (id: string) => {
    if (!apiKey || !id) return

    setLoading(true)
    setError(null)
    try {
      const data = await fetchVAPIAssistant(apiKey, id)
      setAssistant(data)
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to fetch assistant:', err)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  const fetchAllAssistants = useCallback(async () => {
    if (!apiKey) {
      setAssistants([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchVAPIAssistants(apiKey)
      setAssistants(data)
      // If assistantId is provided and we have assistants, fetch the specific one
      if (assistantId && data.length > 0) {
        const found = data.find(a => a.id === assistantId)
        if (found) {
          await fetchAssistant(assistantId)
        }
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to fetch assistants:', err)
    } finally {
      setLoading(false)
    }
  }, [apiKey, assistantId, fetchAssistant])

  useEffect(() => {
    if (assistantId) {
      fetchAssistant(assistantId)
    } else {
      fetchAllAssistants()
    }
  }, [assistantId, fetchAssistant, fetchAllAssistants])

  return {
    assistant,
    assistants,
    loading,
    error,
    refresh: assistantId ? () => fetchAssistant(assistantId) : fetchAllAssistants,
    hasApiKey: !!apiKey
  }
}

