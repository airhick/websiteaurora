/**
 * Calculate stats from call_logs table (faster than fetching from VAPI)
 * Uses a PostgreSQL RPC function for optimal performance
 */

import { supabase } from './supabase'

export interface StatsFromCallLogs {
  totalCalls: number
  live: number
  transferred: number
  totalMinutes: number
}

const CACHE_KEY = 'aurora_call_stats_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes (much longer cache for instant display)

/**
 * Get cached stats synchronously (for immediate display on page load)
 */
export function getCachedStatsSync(): StatsFromCallLogs | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { stats, timestamp } = JSON.parse(cached)
    const now = Date.now()
    
    // Return cached stats if still valid
    if (now - timestamp < CACHE_DURATION) {
      return stats
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Get cached stats from localStorage
 */
function getCachedStats(): StatsFromCallLogs | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { stats, timestamp } = JSON.parse(cached)
    const now = Date.now()
    
    // Return cached stats if still valid
    if (now - timestamp < CACHE_DURATION) {
      return stats
    }
    
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY)
    return null
  } catch {
    return null
  }
}

/**
 * Cache stats in localStorage
 */
function setCachedStats(stats: StatsFromCallLogs): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      stats,
      timestamp: Date.now(),
    }))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Calculate stats from call_logs table using PostgreSQL RPC function
 * This is much faster than fetching all rows and calculating on the client
 */
export async function calculateStatsFromCallLogs(
  customerId: number,
  returnCachedImmediately: boolean = false
): Promise<StatsFromCallLogs> {
  // Try to get from cache first if requested
  if (returnCachedImmediately) {
  const cached = getCachedStats()
  if (cached) {
      // Return cached data immediately, but refresh in background
      // This ensures instant UI while keeping data fresh
      Promise.resolve().then(async () => {
        try {
          await calculateStatsFromCallLogs(customerId, false)
        } catch {
          // Ignore background refresh errors
        }
      })
    return cached
    }
  }

  try {
    // Use RPC function for fast aggregation
    const { data, error } = await supabase.rpc('get_customer_call_stats', {
      customer_id_param: customerId,
    })

    if (error) {
      // If function doesn't exist, fallback to manual calculation
      if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
        console.warn('[calculateStatsFromCallLogs] RPC function not found, using fallback calculation. Please run supabase-stats-function.sql')
        return await calculateStatsFallback(customerId)
      }
      
      // If table doesn't exist, return empty stats
      if (error.code === 'PGRST205' || error.message?.includes('call_logs')) {
        console.warn('[calculateStatsFromCallLogs] call_logs table not found or RLS blocking access')
        return {
          totalCalls: 0,
          live: 0,
          transferred: 0,
          totalMinutes: 0,
        }
      }
      
      console.error('[calculateStatsFromCallLogs] RPC error:', error)
      throw error
    }

    const stats: StatsFromCallLogs = {
      totalCalls: data?.totalCalls || 0,
      live: data?.live || 0,
      transferred: data?.transferred || 0,
      totalMinutes: data?.totalMinutes || 0,
    }

    // Cache the result
    setCachedStats(stats)

    return stats
  } catch (error: any) {
    // If table doesn't exist, return empty stats
    if (error.code === 'PGRST205') {
      return {
        totalCalls: 0,
        live: 0,
        transferred: 0,
        totalMinutes: 0,
      }
    }
    console.error('Error calculating stats from call_logs:', error)
    // Fallback to manual calculation
    return await calculateStatsFallback(customerId)
  }
}

/**
 * Fallback: Calculate stats using optimized parallel queries (much faster)
 * Uses multiple parallel aggregation queries instead of fetching all rows
 */
async function calculateStatsFallback(customerId: number): Promise<StatsFromCallLogs> {
  try {
    // Execute all queries in parallel for maximum speed
    const [totalResult, liveResult, transferredResult, minutesResult] = await Promise.all([
      // Get total count
      supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId),
      
      // Count live calls
      supabase
      .from('call_logs')
        .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
        .in('status', ['in-progress', 'ringing', 'queued']),
      
      // Count transferred calls
      supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .or('ended_reason.ilike.%forward%,ended_reason.ilike.%transfer%,ended_reason.eq.customer-transferred-call'),
      
      // Get sum of durations (we'll need to fetch this one with data)
      supabase
        .from('call_logs')
        .select('duration')
        .eq('customer_id', customerId)
        .not('duration', 'is', null),
    ])

    // Handle errors
    const errors = [totalResult.error, liveResult.error, transferredResult.error, minutesResult.error]
    const hasTableError = errors.some(err => 
      err && (err.code === 'PGRST205' || err.message?.includes('call_logs'))
    )

    if (hasTableError) {
      return {
        totalCalls: 0,
        live: 0,
        transferred: 0,
        totalMinutes: 0,
      }
    }

    // Calculate total minutes from duration data
    let totalMinutes = 0
    if (minutesResult.data && minutesResult.data.length > 0) {
      // Only process up to 1000 rows for duration calculation (should be enough for most cases)
      // If there are more, we'll approximate based on average
      const durations = minutesResult.data.slice(0, 1000).map(d => d.duration).filter(d => d && typeof d === 'number' && d > 0)
      const sum = durations.reduce((acc, d) => acc + d, 0)
      
      if (minutesResult.data.length > 1000) {
        // If we have more than 1000 rows, use average * total count for approximation
        const avg = durations.length > 0 ? sum / durations.length : 0
        const totalCount = totalResult.count || 0
        totalMinutes = (avg * totalCount) / 60
      } else {
        totalMinutes = sum / 60
      }
    }

    const stats = {
      totalCalls: totalResult.count || 0,
      live: liveResult.count || 0,
      transferred: transferredResult.count || 0,
      totalMinutes: parseFloat(totalMinutes.toFixed(2)),
    }

    // Cache the result
    setCachedStats(stats)

    return stats
  } catch (error: any) {
    if (error.code === 'PGRST205' || error.message?.includes('call_logs')) {
      return {
        totalCalls: 0,
        live: 0,
        transferred: 0,
        totalMinutes: 0,
      }
    }
    console.error('Error in fallback calculation:', error)
    throw error
  }
}

