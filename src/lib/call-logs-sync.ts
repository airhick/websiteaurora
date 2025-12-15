/**
 * Call Logs Sync Service
 * Synchronizes VAPI calls with Supabase database
 */

import { supabase } from './supabase'
import { fetchVAPICalls, type VAPICall } from './vapi'
import { getCustomerAgents } from './customer-agents'

export interface CallLog {
  id: number
  vapi_call_id: string
  customer_id: number | null
  status: string | null
  type: string | null
  started_at: string | null
  created_at: string | null
  duration: number | null
  cost: number | null
  customer_number: string | null
  ended_reason: string | null
  summary: string | null
  recording_url: string | null
  transcript: any
  messages: any
  assistant_id: string | null
  artifact: any
  synced_at: string
  created_at_db: string
}

/**
 * Get recording URL from VAPI call artifact
 */
function getRecordingUrl(call: VAPICall): string | null {
  if (!call.artifact) return null
  
  // Check recordingUrl directly
  if (call.artifact.recordingUrl) {
    return call.artifact.recordingUrl
  }
  
  // Check nested recording object
  if (call.artifact.recording?.url) {
    return call.artifact.recording.url
  }
  
  return null
}

/**
 * Extract summary from call analysis or messages
 */
function extractSummary(call: VAPICall): string | null {
  if (call.analysis?.summary) {
    return call.analysis.summary
  }
  
  // Try to extract from messages
  if (call.messages && call.messages.length > 0) {
    const lastMessage = call.messages[call.messages.length - 1]
    if (lastMessage.content && lastMessage.content.length > 0) {
      // Return first 200 characters as summary
      return lastMessage.content.substring(0, 200) + (lastMessage.content.length > 200 ? '...' : '')
    }
  }
  
  return null
}

/**
 * Calculate duration in seconds from call timestamps
 * Falls back to calculating from startedAt and endedAt if duration is not provided
 */
function calculateDuration(call: VAPICall): number | null {
  // If duration is provided and valid, use it
  if (call.duration && typeof call.duration === 'number' && call.duration > 0) {
    return call.duration
  }
  
  // Otherwise, calculate from timestamps
  if (call.startedAt) {
    const startedAt = new Date(call.startedAt).getTime()
    let endedAt: number | null = null
    
    // Check for endedAt directly on the call object
    if (call.endedAt) {
      endedAt = new Date(call.endedAt).getTime()
    }
    // Check artifact for end time
    else if (call.artifact?.endedAt) {
      endedAt = new Date(call.artifact.endedAt).getTime()
    } else if (call.artifact?.ended_at) {
      endedAt = new Date(call.artifact.ended_at).getTime()
    }
    
    if (endedAt && startedAt && endedAt > startedAt) {
      const durationSeconds = Math.round((endedAt - startedAt) / 1000)
      if (durationSeconds > 0) {
        return durationSeconds
      }
    }
  }
  
  return null
}

/**
 * Sync VAPI calls to Supabase
 * Only syncs new calls that don't exist in the database
 * Filters calls by customer's agent IDs
 */
export async function syncCallLogs(
  apiKey: string,
  customerId: number
): Promise<{ synced: number; new: number }> {
  try {
    // Get customer's agent IDs
    const agentIds = await getCustomerAgents(customerId)
    
    if (agentIds.length === 0) {
      console.warn('No agents found for customer', customerId)
      return { synced: 0, new: 0 }
    }
    
    // Fetch calls from VAPI filtered by agent IDs
    // Note: Removed date filter as VAPI API may not support createdAtGt parameter
    // Fetch ALL available calls (VAPI will paginate automatically)
    const vapiCalls = await fetchVAPICalls(apiKey, agentIds, {
      limit: 1000, // Per batch limit - pagination will continue until all calls are fetched
      // Removed createdAtGt - VAPI API returns 400 with date filters
    })
    
    if (vapiCalls.length === 0) {
      console.warn(`No calls found in VAPI for these assistants. Make sure calls exist in VAPI.`)
      return { synced: 0, new: 0 }
    }
    
    if (vapiCalls.length === 0) {
      return { synced: 0, new: 0 }
    }
    
    // Get existing call IDs from database (check if table exists first)
    let existingCallIds = new Set<string>()
    
    try {
      const { data: existingCalls, error: fetchError } = await supabase
        .from('call_logs')
        .select('vapi_call_id')
        .eq('customer_id', customerId)
      
      if (fetchError) {
        // If table doesn't exist, log warning but continue
        if (fetchError.code === 'PGRST205' || fetchError.message?.includes('call_logs')) {
          console.warn('call_logs table does not exist yet. Please run supabase-call-logs-schema.sql')
          // Continue without filtering - all calls will be new
        } else {
          console.error('Error fetching existing calls:', fetchError)
          throw fetchError
        }
      } else {
        existingCallIds = new Set(existingCalls?.map(c => c.vapi_call_id) || [])
      }
    } catch (error: any) {
      // If table doesn't exist, continue without filtering
      if (error.code === 'PGRST205') {
        console.warn('call_logs table does not exist yet. Please run supabase-call-logs-schema.sql')
      } else {
        throw error
      }
    }
    
    // Filter out calls that already exist
    const newCalls = vapiCalls.filter(call => !existingCallIds.has(call.id))
    
    if (newCalls.length === 0) {
      return { synced: vapiCalls.length, new: 0 }
    }
    
    // Prepare data for insertion
    const callLogsToInsert = newCalls.map(call => {
      const calculatedDuration = calculateDuration(call)
      
      return {
      vapi_call_id: call.id,
      customer_id: customerId,
      status: call.status,
      type: call.type,
      started_at: call.startedAt || call.createdAt || null,
      created_at: call.createdAt || null,
        duration: calculatedDuration, // Use calculated duration (from VAPI or computed from timestamps)
      cost: call.cost || null,
      customer_number: call.customer?.number || null,
      ended_reason: call.endedReason || null,
      summary: extractSummary(call),
      recording_url: getRecordingUrl(call),
      transcript: call.transcript || null,
      messages: call.messages || null,
      assistant_id: call.assistantId || null,
      artifact: call.artifact || null,
      }
    })
    
    // Insert new calls (only if table exists)
    try {
      const { error: insertError } = await supabase
        .from('call_logs')
        .insert(callLogsToInsert)
      
      if (insertError) {
        if (insertError.code === 'PGRST205') {
          console.warn('[syncCallLogs] ⚠️ call_logs table does not exist. Please run supabase-call-logs-schema.sql')
          // Return success but warn user
          return {
            synced: vapiCalls.length,
            new: newCalls.length,
          }
        }
        console.error('Error inserting call logs:', insertError)
        throw insertError
      }
    } catch (error: any) {
      if (error.code === 'PGRST205') {
        console.warn('[syncCallLogs] ⚠️ call_logs table does not exist. Please run supabase-call-logs-schema.sql')
        return {
          synced: vapiCalls.length,
          new: newCalls.length,
        }
      }
      console.error('Exception during insert:', error)
      throw error
    }
    // After syncing new calls, update durations for existing calls that don't have them
    // This backfills duration for calls that were synced before we added duration calculation
    try {
      await updateMissingDurations(customerId, vapiCalls)
    } catch (error) {
      // Don't fail the sync if duration update fails
      console.error('Error updating missing durations:', error)
    }
    
    return {
      synced: vapiCalls.length,
      new: newCalls.length,
    }
  } catch (error: any) {
    console.error('Error syncing call logs:', error)
    throw error
  }
}

/**
 * Update duration for existing calls that have NULL duration
 * Uses the VAPI calls data we already have to backfill missing durations
 */
async function updateMissingDurations(
  customerId: number,
  vapiCalls: VAPICall[]
): Promise<void> {
  try {
    // Create a map of VAPI calls by ID for quick lookup
    const vapiCallsMap = new Map(vapiCalls.map(call => [call.id, call]))
    
    // Process in batches to avoid overwhelming the database
    let offset = 0
    const batchSize = 100
    let hasMore = true
    
    while (hasMore) {
      // Get calls from database that have NULL duration
      const { data: callsWithoutDuration, error: fetchError } = await supabase
        .from('call_logs')
        .select('id, vapi_call_id, started_at, created_at, artifact')
        .eq('customer_id', customerId)
        .is('duration', null)
        .range(offset, offset + batchSize - 1)
      
      if (fetchError) {
        if (fetchError.code === 'PGRST205') {
          return // Table doesn't exist, skip
        }
        throw fetchError
      }
      
      if (!callsWithoutDuration || callsWithoutDuration.length === 0) {
        hasMore = false
        break
      }
      
      // Update each call with calculated duration
      const updates = callsWithoutDuration.map(async (callLog) => {
        // Try to find the call in the VAPI calls we just fetched
        const vapiCall = vapiCallsMap.get(callLog.vapi_call_id)
        
        let calculatedDuration: number | null = null
        
        if (vapiCall) {
          // Use VAPI call data if available
          calculatedDuration = calculateDuration(vapiCall)
        } else {
          // Otherwise, try to calculate from existing database data
          if (callLog.started_at) {
            const startedAt = new Date(callLog.started_at).getTime()
            let endedAt: number | null = null
            
            // Check artifact for end time
            if (callLog.artifact) {
              const artifact = callLog.artifact as any
              if (artifact.endedAt) {
                endedAt = new Date(artifact.endedAt).getTime()
              } else if (artifact.ended_at) {
                endedAt = new Date(artifact.ended_at).getTime()
              }
            }
            
            if (endedAt && startedAt && endedAt > startedAt) {
              calculatedDuration = Math.round((endedAt - startedAt) / 1000)
            }
          }
        }
        
        if (calculatedDuration && calculatedDuration > 0) {
          const { error: updateError } = await supabase
            .from('call_logs')
            .update({ duration: calculatedDuration })
            .eq('id', callLog.id)
          
          if (updateError) {
            console.error(`Error updating duration for call ${callLog.vapi_call_id}:`, updateError)
          }
        }
      })
      
      await Promise.all(updates)
      
      // Check if we need to process more
      if (callsWithoutDuration.length < batchSize) {
        hasMore = false
      } else {
        offset += batchSize
      }
    }
  } catch (error: any) {
    console.error('Error in updateMissingDurations:', error)
    // Don't throw - this is a background operation
  }
}

/**
 * Get call logs from Supabase
 */
export async function getCallLogs(
  customerId: number,
  limit: number = 50
): Promise<CallLog[]> {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('customer_id', customerId)
      .order('started_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST205' || error.message?.includes('call_logs')) {
        console.warn('call_logs table does not exist. Please run supabase-call-logs-schema.sql')
        return []
      }
      console.error('Error fetching call logs:', error)
      throw error
    }
    
    return (data || []) as CallLog[]
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST205') {
      console.warn('call_logs table does not exist. Please run supabase-call-logs-schema.sql')
      return []
    }
    console.error('Error getting call logs:', error)
    throw error
  }
}

/**
 * Check if there are new calls by comparing latest call timestamp
 * Filters by customer's agent IDs
 */
export async function hasNewCalls(
  apiKey: string,
  customerId: number
): Promise<boolean> {
  try {
    // Get customer's agent IDs
    const agentIds = await getCustomerAgents(customerId)
    
    if (agentIds.length === 0) {
      return false
    }
    
    // Get latest call from VAPI filtered by agent IDs
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const startDate = oneYearAgo.toISOString().split('T')[0] + 'T00:00:00Z'
    
    const vapiCalls = await fetchVAPICalls(apiKey, agentIds, {
      limit: 100,
      createdAtGt: startDate,
    })
    if (vapiCalls.length === 0) return false
    
    // Sort by startedAt or createdAt
    const latestVapiCall = vapiCalls.sort((a, b) => {
      const aTime = a.startedAt || a.createdAt || ''
      const bTime = b.startedAt || b.createdAt || ''
      return bTime.localeCompare(aTime)
    })[0]
    
    // Get latest call from database
    try {
      const { data: latestDbCall, error } = await supabase
        .from('call_logs')
        .select('started_at, created_at')
        .eq('customer_id', customerId)
        .order('started_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist, assume there are new calls
        if (error.code === 'PGRST205') {
          return vapiCalls.length > 0
        }
        console.error('Error checking for new calls:', error)
        return true // Assume there are new calls if we can't check
      }
      
      if (!latestDbCall) {
        return vapiCalls.length > 0
      }
      
      // Compare timestamps
      const vapiTime = latestVapiCall.startedAt || latestVapiCall.createdAt || ''
      const dbTime = latestDbCall.started_at || latestDbCall.created_at || ''
      
      return vapiTime > dbTime
    } catch (error: any) {
      // If table doesn't exist, assume there are new calls
      if (error.code === 'PGRST205') {
        return vapiCalls.length > 0
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error checking for new calls:', error)
    return true // Assume there are new calls on error
  }
}

