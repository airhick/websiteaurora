import { useState, useEffect, useCallback, useRef } from 'react'
import { type VAPICall } from '@/lib/vapi'
import { getCallLogs, type CallLog } from '@/lib/call-logs-sync'
import { getCustomerId } from '@/lib/vapi-api-key'

/**
 * Convert CallLog to VAPICall format
 */
function callLogToVAPICall(log: CallLog): VAPICall {
  return {
    id: log.vapi_call_id,
    status: log.status || 'unknown',
    type: log.type || 'unknown',
    startedAt: log.started_at || undefined,
    createdAt: log.created_at_db || undefined,
    duration: log.duration || undefined,
    endedReason: log.ended_reason || undefined,
    messages: log.messages || undefined,
    transcript: log.transcript || undefined,
    assistantId: log.assistant_id || undefined,
    artifact: undefined, // Not stored in call_logs table
  }
}

export function useVAPICalls() {
  const [calls, setCalls] = useState<VAPICall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRefreshingRef = useRef(false)

  // Load calls from Supabase call_logs table only (no VAPI API calls)
  useEffect(() => {
    const loadFromDB = async () => {
      const customerId = getCustomerId()
      if (!customerId) {
        setCalls([])
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Load calls from Supabase call_logs table only
        const dbLogs = await getCallLogs(customerId, 1000) // Load up to 1000 calls
        const dbCalls = dbLogs.map(callLogToVAPICall)
        setCalls(dbCalls)
      } catch (err: any) {
        // If table doesn't exist, show error
        if (err.code === 'PGRST205' || err.message?.includes('call_logs')) {
          setError('call_logs table does not exist. Please run supabase-call-logs-schema.sql')
        } else {
          console.error('Error loading calls from DB:', err)
          setError(err.message || 'Failed to load calls')
        }
        setCalls([])
      } finally {
        setLoading(false)
      }
    }

    loadFromDB()
  }, [])

  const refreshCalls = useCallback(async () => {
    // Prevent concurrent calls
    if (isRefreshingRef.current) {
      return
    }

    const customerId = getCustomerId()
    if (!customerId) {
      setCalls([])
      return
    }

    isRefreshingRef.current = true
    setLoading(true)
    setError(null)
    try {
      // Only load from Supabase call_logs table - no VAPI API calls
      const dbLogs = await getCallLogs(customerId, 1000)
      const dbCalls = dbLogs.map(callLogToVAPICall)
      setCalls(dbCalls)
    } catch (err: any) {
      if (err.code === 'PGRST205' || err.message?.includes('call_logs')) {
        setError('call_logs table does not exist. Please run supabase-call-logs-schema.sql')
      } else {
        console.error('[useVAPICalls] Error loading from DB:', err)
        setError(err.message || 'Failed to refresh calls')
      }
    } finally {
      setLoading(false)
      isRefreshingRef.current = false
    }
  }, [])

  // Auto-refresh calls periodically from Supabase only
  useEffect(() => {
    const customerId = getCustomerId()
    if (customerId) {
      const initialFetchTimeout = setTimeout(() => {
      refreshCalls()
      }, 2000) // Initial delay of 2 seconds

      const interval = setInterval(() => {
        refreshCalls()
      }, 5 * 60 * 1000) // Refresh every 5 minutes from Supabase

      return () => {
        clearTimeout(initialFetchTimeout)
        clearInterval(interval)
      }
    }
  }, [refreshCalls])

  return {
    calls,
    loading,
    error,
    refreshCalls,
  }
}
