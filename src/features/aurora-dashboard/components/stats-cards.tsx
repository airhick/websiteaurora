import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Zap, PhoneForwarded, Clock, RefreshCw } from 'lucide-react'
import { useVAPICalls } from '@/hooks/use-vapi-calls'
import { calculateStats } from '@/lib/vapi'
import { useCustomerPlan } from '@/hooks/use-customer-plan'
import { calculateStatsFromCallLogs } from '@/lib/stats-from-call-logs'
import { getCustomerId, getVAPIApiKey } from '@/lib/vapi-api-key'
import { syncCallLogs } from '@/lib/call-logs-sync'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/translations'

// Initialize stats from cache synchronously (before first render)
function getInitialStatsFromCache() {
  try {
    const cached = localStorage.getItem('aurora_call_stats_cache')
    if (cached) {
      const { stats: cachedStats, timestamp } = JSON.parse(cached)
      const now = Date.now()
      // Use cache if less than 5 minutes old
      if (now - timestamp < 5 * 60 * 1000) {
        return cachedStats
      }
    }
  } catch {
    // Ignore cache errors
  }
  return { totalCalls: 0, live: 0, transferred: 0, totalMinutes: 0 }
}

export function StatsCards() {
  const { calls, loading: vapiLoading } = useVAPICalls()
  const { plan } = useCustomerPlan()
  const t = useTranslation()
  // Initialize with cached stats immediately (synchronous, no loading state)
  const [stats, setStats] = useState(getInitialStatsFromCache)
  const cachedStats = getInitialStatsFromCache()
  const hasCachedData = cachedStats.totalCalls > 0 || cachedStats.totalMinutes > 0
  const [loading, setLoading] = useState(!hasCachedData) // Show loading if no cache
  const [syncing, setSyncing] = useState(false)

  // Calculate stats directly from VAPI calls (primary source for minutes)
  useEffect(() => {
    if (!vapiLoading && calls.length > 0) {
      // Calculate stats from VAPI calls - this includes accurate minutes calculation
      const vapiStats = calculateStats(calls)
      setStats(vapiStats)
      setLoading(false)
      
      // Cache the VAPI stats
      try {
        localStorage.setItem('aurora_call_stats_cache', JSON.stringify({
          stats: vapiStats,
          timestamp: Date.now(),
        }))
      } catch {
        // Ignore cache errors
      }
    } else if (!vapiLoading && calls.length === 0) {
      // No calls loaded yet, try to load from DB as fallback
    const loadStatsFromDB = async () => {
      const customerId = getCustomerId()
        
      if (!customerId) {
          setLoading(false)
        return
      }

        // Check cache first
      const cached = getInitialStatsFromCache()
      if (cached.totalCalls > 0 || cached.totalMinutes > 0) {
          setStats(cached)
          setLoading(false)
        return
      }

        // No cache, try DB
      try {
        const dbStats = await calculateStatsFromCallLogs(customerId)
        setStats(dbStats)
      } catch (error) {
        console.error('Error loading stats from DB:', error)
          setStats({ totalCalls: 0, live: 0, transferred: 0, totalMinutes: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadStatsFromDB()
    }
  }, [calls, vapiLoading])

  // Manual sync function
  const handleSync = async () => {
    const customerId = getCustomerId()
    const apiKey = getVAPIApiKey()
    
    if (!customerId || !apiKey) {
      toast.error('Customer ID or API key not found')
      return
    }

    setSyncing(true)
    setLoading(true)
    try {
      toast.info('Syncing calls from VAPI... This may take a moment.')
      
      const result = await syncCallLogs(apiKey, customerId)
      
      if (result.new > 0) {
        toast.success(`Synced ${result.new} new call${result.new > 1 ? 's' : ''} (${result.synced} total available)`)
      } else if (result.synced > 0) {
        toast.success(`All ${result.synced} call${result.synced > 1 ? 's' : ''} already synced.`)
      } else {
        toast.warning('No calls found to sync. Make sure you have calls in VAPI for your agents.')
      }
      
      // After sync, stats will be updated automatically when VAPI calls refresh
    } catch (error: any) {
      console.error('Sync error:', error)
      toast.error(`Failed to sync: ${error.message || 'Unknown error'}`)
    } finally {
      setSyncing(false)
      setLoading(false)
    }
  }

  const planMinutes = plan
    ? {
        basic: 300,
        pro: 1000,
        entreprise: 2500,
      }[plan]
    : null

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stats.totalCalls === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{t.stats.noCallData}</p>
              <p className="text-xs text-muted-foreground">
                {t.stats.syncCallLogs}
              </p>
            </div>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              size="sm"
            >
              {syncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t.stats.syncing}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t.stats.syncCalls}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.stats.totalCalls}</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCalls}</div>
          <p className="text-xs text-muted-foreground">{t.stats.allTimeCalls}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.stats.activeLive}</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.live}</div>
          <p className="text-xs text-muted-foreground">{t.stats.currentlyInProgress}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.stats.transferred}</CardTitle>
          <PhoneForwarded className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.transferred}</div>
          <p className="text-xs text-muted-foreground">{t.stats.callsTransferred}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.stats.totalMinutes}</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {planMinutes ? (
              <>
                {Math.round(stats.totalMinutes).toLocaleString()} / {planMinutes.toLocaleString()}
              </>
            ) : (
              Math.round(stats.totalMinutes).toLocaleString()
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {planMinutes 
              ? t.stats.minutesUsedTotal.replace('{plan}', plan || t.stats.plan)
              : t.stats.totalMinutesUsed}
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

