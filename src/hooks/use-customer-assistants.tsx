import { useState, useEffect, useCallback } from 'react'
import { fetchVAPIAssistant, type VAPIAssistant } from '@/lib/vapi'
import { getCustomerAgents } from '@/lib/customer-agents'
import { getVAPIApiKey, getCustomerId } from '@/lib/vapi-api-key'
import { toast } from 'sonner'

export interface AssistantWithConfig extends VAPIAssistant {
  loading?: boolean
  error?: string | null
}

export function useCustomerAssistants() {
  const [assistants, setAssistants] = useState<AssistantWithConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)

  // Load API key on mount (global key, same for all customers)
  useEffect(() => {
    const key = getVAPIApiKey()
    setApiKey(key)
  }, [])

  // Fetch all assistant configurations
  const fetchAssistants = useCallback(async () => {
    const customerId = getCustomerId()
    
    // Get API key (global, same for all customers)
    let currentApiKey = apiKey
    if (!currentApiKey) {
      currentApiKey = getVAPIApiKey()
      setApiKey(currentApiKey)
    }
    
    if (!customerId) {
      console.warn('No customer ID found. Cannot fetch assistants.')
      setError('Customer ID not found. Please ensure you are logged in.')
      setAssistants([])
      setLoading(false)
      return
    }

    if (!currentApiKey) {
      console.warn('No VAPI API key found. Cannot fetch assistants.')
      setError('VAPI API key not configured')
      setAssistants([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get agent IDs from customer table - ONLY for this specific customer ID
      const agentIds = await getCustomerAgents(customerId)
      
      if (agentIds.length === 0) {
        setError(`No agents configured for customer ID ${customerId}. Please configure agents in customer settings.`)
        setAssistants([])
        setLoading(false)
        return
      }

      // Fetch configuration for each assistant (matching Python script logic)
      const assistantPromises = agentIds.map(async (agentId) => {
        try {
          const cleanId = agentId.trim() // Remove any accidental spaces (matching Python)
          
          if (!cleanId) {
            return null
          }
          
          const config = await fetchVAPIAssistant(currentApiKey!, cleanId)
          
          return {
            ...config,
            loading: false,
            error: null,
          } as AssistantWithConfig
        } catch (err: any) {
          console.error(`Failed to fetch assistant ${agentId}:`, err)
          return {
            id: agentId,
            name: `Failed: ${agentId}`,
            loading: false,
            error: err.message || 'Failed to fetch configuration',
          } as AssistantWithConfig
        }
      })

      // Filter out null results and await all promises
      const results = (await Promise.all(assistantPromises)).filter((r): r is AssistantWithConfig => r !== null)

      const successfulResults = results.filter(r => !r.error)
      const failedResults = results.filter(r => r.error)
      
      if (failedResults.length > 0) {
        console.warn(`${failedResults.length} assistants failed to load`)
      }
      
      if (successfulResults.length === 0 && failedResults.length > 0) {
        setError(`Failed to load assistants. Check console for details.`)
      }
      
      setAssistants(results)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch assistants'
      setError(errorMessage)
      console.error('Failed to fetch assistants:', err)
      toast.error(`Failed to load assistant configurations: ${errorMessage}`)
      setAssistants([])
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    if (apiKey !== null) {
      // Delay fetching assistants to not block initial page load
      // This component is lazy loaded, but still delay the fetch
      const timeout = setTimeout(() => {
        fetchAssistants()
      }, 2000) // Delay by 2 seconds after component mounts
      
      return () => clearTimeout(timeout)
    }
  }, [apiKey, fetchAssistants])

  return {
    assistants,
    loading,
    error,
    refresh: fetchAssistants,
    hasApiKey: !!apiKey,
  }
}

