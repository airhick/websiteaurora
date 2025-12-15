import { useState, useEffect, useCallback } from 'react'
import { fetchVAPICalls, type VAPICall } from '@/lib/vapi'
import { getVAPIApiKey, getCustomerId } from '@/lib/vapi-api-key'
import { getCustomerAgents } from '@/lib/customer-agents'
import { getCallLogs, type CallLog } from '@/lib/call-logs-sync'
import { toast } from 'sonner'

/**
 * Convert CallLog to VAPICall format
 */
function callLogToVAPICall(log: CallLog): VAPICall {
  return {
    id: log.vapi_call_id,
    status: log.status || 'unknown',
    type: log.type || 'unknown',
    startedAt: log.started_at || undefined,
    createdAt: log.created_at || undefined,
    duration: log.duration || undefined,
    cost: log.cost ? parseFloat(String(log.cost)) : undefined,
    customer: log.customer_number ? { number: log.customer_number } : undefined,
    endedReason: log.ended_reason || undefined,
    messages: log.messages || undefined,
    transcript: log.transcript || undefined,
    assistantId: log.assistant_id || undefined,
    artifact: log.artifact || undefined,
  }
}

export function useVAPICalls() {
  const [calls, setCalls] = useState<VAPICall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)

  // Load API key on mount (global key, same for all customers)
  useEffect(() => {
    const key = getVAPIApiKey()
    setApiKey(key)
  }, [])

  // Load calls from database - DELAYED to not block initial page load
  // Stats are calculated separately from call_logs table, so this is only for Recent Activity
  useEffect(() => {
    // Delay loading by 1.5 seconds to let stats load first
    const timeout = setTimeout(() => {
      const loadFromDB = async () => {
        const customerId = getCustomerId()
        if (!customerId) return

        try {
          // Load only a small batch initially (for Recent Activity, not for stats)
          // Stats are calculated separately from call_logs table
          const dbLogs = await getCallLogs(customerId, 50) // Only 50 calls for initial display
          const dbCalls = dbLogs.map(callLogToVAPICall)
          setCalls(dbCalls)
        } catch (err: any) {
          // If table doesn't exist, that's okay - we'll fetch from VAPI
          if (err.code !== 'PGRST205' && !err.message?.includes('call_logs')) {
            console.error('Error loading calls from DB:', err)
          }
        }
      }

      loadFromDB()
    }, 1500) // Delay by 1.5 seconds

    return () => clearTimeout(timeout)
  }, [])

  const refreshCalls = useCallback(async () => {
    // Get API key (global, same for all customers)
    let currentApiKey = apiKey
    if (!currentApiKey) {
      currentApiKey = getVAPIApiKey()
      setApiKey(currentApiKey)
    }

    if (!currentApiKey) {
      setCalls([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Get customer ID and agent IDs to filter calls
      const customerId = getCustomerId()
      let agentIds: string[] | undefined
      
      if (customerId) {
        try {
          agentIds = await getCustomerAgents(customerId)
        } catch (err) {
          console.warn('Failed to get customer agents, fetching all calls:', err)
        }
      }
      
      // Fetch all calls (with pagination) filtered by agent IDs if available
      // This runs in background to update data
      const data = await fetchVAPICalls(currentApiKey, agentIds && agentIds.length > 0 ? agentIds : undefined)
      setCalls(data)
    } catch (err: any) {
      setError(err.message)
      // Don't show error toast for background refresh
      console.error('Failed to fetch calls:', err)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  // Refresh from VAPI in background after initial load
  useEffect(() => {
    if (apiKey !== null) {
      // Wait a bit before refreshing from VAPI to let DB load finish
      const timeout = setTimeout(() => {
        refreshCalls()
      }, 1000)

      // Refresh every 5 minutes (less frequent to reduce load)
      const interval = setInterval(() => {
        refreshCalls()
      }, 5 * 60 * 1000) // 5 minutes

      return () => {
        clearTimeout(timeout)
        clearInterval(interval)
      }
    }
  }, [apiKey, refreshCalls])

  return {
    calls,
    loading,
    error,
    refreshCalls,
    hasApiKey: !!apiKey
  }
}

