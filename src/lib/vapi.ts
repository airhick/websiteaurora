/**
 * VAPI API Service
 * Handles all VAPI API interactions
 */

const VAPI_BASE_URL = 'https://api.vapi.ai'

export interface VAPICall {
  id: string
  status: string
  type: string
  startedAt?: string
  createdAt?: string
  endedAt?: string
  duration?: number
  cost?: number
  customer?: {
    number?: string
  }
  endedReason?: string
  messages?: Array<{
    role: string
    content: string
    toolCalls?: Array<{
      function: {
        name: string
        arguments: string
      }
    }>
  }>
  analysis?: {
    summary?: string
  }
  assistantId?: string
  transcript?: Array<{
    role: string
    content: string
    toolCalls?: Array<{
      function: {
        name: string
        arguments: string
      }
    }>
  }>
  artifact?: {
    recordingUrl?: string
    recording?: {
      url?: string
    }
    endedAt?: string
    ended_at?: string
    [key: string]: any
  }
}

export interface VAPIAssistant {
  id: string
  name?: string
  model?: {
    model?: string // Model name (e.g., "gpt-4", "gpt-3.5-turbo")
    messages?: Array<{
      role: string
      content: string
    }>
    systemMessage?: string
    system_message?: string
    tools?: Array<{
      function?: {
        name: string
        description?: string
        parameters?: any
      }
      type?: string
    }>
    [key: string]: any // Allow additional properties from VAPI API
  }
  [key: string]: any // Allow additional properties from VAPI API
}

export async function fetchVAPICalls(
  apiKey: string,
  assistantIds?: string[],
  options?: {
    limit?: number
    createdAtGt?: string // ISO date string
    createdAtLt?: string // ISO date string for pagination
  }
): Promise<VAPICall[]> {
  // If assistantIds provided, fetch calls for each assistant and combine
  if (assistantIds && assistantIds.length > 0) {
    const allCalls: VAPICall[] = []
    const limit = options?.limit || 1000
    
    // Fetch calls for each assistant independently with pagination
    for (const assistantId of assistantIds) {
    let hasMore = true
    let createdAtLt: string | undefined = options?.createdAtLt
      let assistantCalls: VAPICall[] = []
      let pageCount = 0
      const maxPages = 1000 // Safety limit to prevent infinite loops
      
      // Paginate through all calls for this assistant
      while (hasMore && pageCount < maxPages) {
        pageCount++
        try {
          // Build query params
          const params = new URLSearchParams()
          params.append('assistantId', assistantId)
          params.append('limit', String(limit))
          
          if (options?.createdAtGt) {
            params.append('createdAtGt', options.createdAtGt)
          }
          
          if (createdAtLt) {
            params.append('createdAtLt', createdAtLt)
          }
          
          const response = await fetch(`${VAPI_BASE_URL}/call?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read error response')
            console.error(`Failed to fetch calls for assistant ${assistantId}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              url: `${VAPI_BASE_URL}/call?${params.toString()}`
            })
            hasMore = false
            break
          }

          const data = await response.json()
          // Handle different response formats: array, { results: [] }, or { calls: [] }
          let calls: VAPICall[] = []
          if (Array.isArray(data)) {
            calls = data
          } else if (data.results && Array.isArray(data.results)) {
            calls = data.results
          } else if (data.calls && Array.isArray(data.calls)) {
            calls = data.calls
          } else {
            console.warn(`Unexpected response format for assistant ${assistantId}`)
            calls = []
          }
          
          if (calls.length === 0) {
            hasMore = false
            break
          }
          
          // Check for duplicate calls (indicates pagination issue)
          const existingIds = new Set(assistantCalls.map(c => c.id))
          const newCalls = calls.filter(c => !existingIds.has(c.id))
          const duplicates = calls.length - newCalls.length
          
          if (duplicates > 0) {
            console.warn(`Found ${duplicates} duplicate calls in batch ${pageCount} for assistant ${assistantId}. This may indicate a pagination issue.`)
          }
          
          assistantCalls.push(...newCalls)
          
          // If we got fewer calls than the limit, we're done with this assistant
          if (calls.length < limit) {
            hasMore = false
          } else {
            // Update cursor for next batch
            // VAPI API returns calls sorted by createdAt DESCENDING (newest first)
            // So the LAST call in the array is the oldest one
            // We use its createdAt for createdAtLt to fetch older calls
            const lastCall = calls[calls.length - 1]
            const oldestTime = lastCall.createdAt || lastCall.startedAt
            
            if (oldestTime) {
              // Prevent infinite loop: if createdAtLt hasn't changed, stop
              if (createdAtLt === oldestTime) {
                console.warn(`Pagination stopped: createdAtLt unchanged for assistant ${assistantId}`)
                hasMore = false
              } else {
                createdAtLt = oldestTime
              }
            } else {
              hasMore = false
            }
          }
        } catch (error) {
          console.error(`Error fetching calls for assistant ${assistantId}:`, error)
          hasMore = false
        }
      }
      
      if (pageCount >= maxPages) {
        console.warn(`Reached max pages (${maxPages}) for assistant ${assistantId}, stopping pagination`)
      }
      
      allCalls.push(...assistantCalls)
    }
    
    // Remove duplicates based on call ID
    const uniqueCalls = Array.from(
      new Map(allCalls.map(call => [call.id, call])).values()
    )
    return uniqueCalls
  }
  
  // Fetch all calls if no assistant filter (with pagination)
  const allCalls: VAPICall[] = []
  let hasMore = true
  let createdAtLt: string | undefined = options?.createdAtLt
  const limit = options?.limit || 1000

  while (hasMore) {
    const params = new URLSearchParams()
    params.append('limit', String(limit))
    
    if (options?.createdAtGt) {
      params.append('createdAtGt', options.createdAtGt)
    }
    
    if (createdAtLt) {
      params.append('createdAtLt', createdAtLt)
    }
    
    const response = await fetch(`${VAPI_BASE_URL}/call?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch calls. Check your API Key.')
    }

    const data = await response.json()
    const calls = Array.isArray(data) ? data : (data.results || [])
    
    if (calls.length === 0) {
      hasMore = false
      break
    }
    
    allCalls.push(...calls)
    
    // If we got fewer calls than the limit, we're done
    if (calls.length < limit) {
      hasMore = false
    } else {
      // Find the oldest createdAt for the next page
      const sortedCalls = calls.sort((a, b) => {
        const aTime = a.createdAt || a.startedAt || ''
        const bTime = b.createdAt || b.startedAt || ''
        return aTime.localeCompare(bTime)
      })
      
      if (sortedCalls.length > 0) {
        createdAtLt = sortedCalls[0].createdAt || sortedCalls[0].startedAt
      } else {
        hasMore = false
      }
    }
    
    // Safety limit: don't fetch more than 50,000 calls total
    if (allCalls.length >= 50000) {
      hasMore = false
    }
  }
  
  // Remove duplicates based on call ID
  const uniqueCalls = Array.from(
    new Map(allCalls.map(call => [call.id, call])).values()
  )
  
  return uniqueCalls
}

export async function fetchVAPICallDetail(apiKey: string, callId: string): Promise<VAPICall> {
  const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch call details')
  }

  return await response.json()
}

export async function fetchVAPIAssistant(apiKey: string, assistantId: string): Promise<VAPIAssistant> {
  // Clean the assistant ID (remove any whitespace or invalid characters)
  const cleanAssistantId = assistantId.trim()
  
  if (!cleanAssistantId) {
    throw new Error('Invalid assistant ID')
  }

  const response = await fetch(`${VAPI_BASE_URL}/assistant/${cleanAssistantId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Failed to fetch assistant ${cleanAssistantId}:`, response.status, errorText)
    throw new Error(`Failed to fetch assistant details: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

export async function fetchVAPIAssistants(apiKey: string): Promise<VAPIAssistant[]> {
  const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch assistants')
  }

  const data = await response.json()
  return Array.isArray(data) ? data : (data.results || [])
}

export function extractToolCalls(call: VAPICall) {
  const toolCalls: Array<{
    name: string
    arguments: string
    timestamp?: string
  }> = []

  if (call.messages && Array.isArray(call.messages)) {
    call.messages.forEach(msg => {
      if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
        msg.toolCalls.forEach(tc => {
          if (tc?.function?.name) {
            toolCalls.push({
              name: tc.function.name,
              arguments: tc.function.arguments || '{}',
            })
          }
        })
      }
    })
  }

  if (call.transcript && Array.isArray(call.transcript)) {
    call.transcript.forEach(msg => {
      if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
        msg.toolCalls.forEach(tc => {
          if (tc?.function?.name) {
            toolCalls.push({
              name: tc.function.name,
              arguments: tc.function.arguments || '{}',
            })
          }
        })
      }
    })
  }

  return toolCalls
}

export function calculateStats(calls: VAPICall[]) {
  if (!calls.length) {
    return {
      totalCalls: 0,
      live: 0,
      transferred: 0,
      totalMinutes: 0
    }
  }

  let transferred = 0
  let live = 0
  let totalMinutes = 0

  calls.forEach(call => {
    let callMinutes = 0
    
    // Calculate minutes from duration (duration is in seconds)
    if (call.duration && typeof call.duration === 'number' && call.duration > 0) {
      callMinutes = call.duration / 60 // Convert seconds to minutes
    } else {
      // If duration is not available, try to calculate from startedAt and endedAt
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
          const durationSeconds = (endedAt - startedAt) / 1000
          if (durationSeconds > 0) {
            callMinutes = durationSeconds / 60
          }
        }
      }
    }
    
    totalMinutes += callMinutes

    if (['in-progress', 'ringing', 'queued'].includes(call.status)) {
      live++
    }

    const reason = call.endedReason || ''
    if (reason.includes('forward') || reason.includes('transfer') || reason === 'customer-transferred-call') {
      transferred++
    }
  })

  return {
    totalCalls: calls.length,
    transferred,
    live,
    totalMinutes: parseFloat(totalMinutes.toFixed(2))
  }
}

