import { useState, useEffect, useCallback } from 'react'
import { getCallLogs, syncCallLogs, hasNewCalls, type CallLog } from '@/lib/call-logs-sync'
import { getVAPIApiKey, getCustomerId } from '@/lib/vapi-api-key'
import { toast } from 'sonner'

export function useCallLogs() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get API key (global, same for all customers)
  const getApiKey = useCallback((): string | null => {
    return getVAPIApiKey()
  }, [])

  // Load call logs from Supabase
  const loadCallLogs = useCallback(async () => {
    const customerId = getCustomerId()
    if (!customerId) {
      setCallLogs([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const logs = await getCallLogs(customerId)
      setCallLogs(logs)
    } catch (err: any) {
      // Check if it's a table not found error
      if (err.message?.includes('call_logs') || err.code === 'PGRST205') {
        setError('call_logs table does not exist. Please run supabase-call-logs-schema.sql')
      } else {
        setError(err.message)
      }
      console.error('Error loading call logs:', err)
    } finally {
      setLoading(false)
    }
  }, [getCustomerId])

  // Sync with VAPI
  const syncWithVAPI = useCallback(async () => {
    const customerId = getCustomerId()
    const apiKey = getApiKey()

    if (!customerId || !apiKey) {
      return { synced: 0, new: 0 }
    }

    setSyncing(true)
    try {
      // Check if there are new calls
      const hasNew = await hasNewCalls(apiKey, customerId)
      
      if (!hasNew) {
        return { synced: callLogs.length, new: 0 }
      }

      // Sync new calls
      const result = await syncCallLogs(apiKey, customerId)
      
      // Reload call logs after sync
      await loadCallLogs()
      
      if (result.new > 0) {
        toast.success(`Synced ${result.new} new call${result.new > 1 ? 's' : ''}`)
      }
      
      return result
    } catch (err: any) {
      console.error('Error syncing call logs:', err)
      toast.error('Failed to sync call logs: ' + err.message)
      return { synced: 0, new: 0 }
    } finally {
      setSyncing(false)
    }
  }, [getCustomerId, getApiKey, callLogs.length, loadCallLogs])

  // Initial load - DELAYED to not block initial page load
  useEffect(() => {
    // Delay loading call logs to not block initial page load
    // This component is lazy loaded, but still delay the fetch
    const timeout = setTimeout(() => {
      loadCallLogs()
    }, 2000) // Delay by 2 seconds after component mounts
    
    return () => clearTimeout(timeout)
  }, [loadCallLogs])

  // Auto-sync every 5 minutes
  useEffect(() => {
    const customerId = getCustomerId()
    const apiKey = getApiKey()
    
    if (!customerId || !apiKey) return

    const interval = setInterval(() => {
      syncWithVAPI()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [getCustomerId, getApiKey, syncWithVAPI])

  return {
    callLogs,
    loading,
    syncing,
    error,
    refresh: loadCallLogs,
    sync: syncWithVAPI,
  }
}

