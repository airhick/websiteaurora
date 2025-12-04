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
}

export interface VAPIAssistant {
  id: string
  name?: string
  model?: {
    messages?: Array<{
      role: string
      content: string
    }>
    systemMessage?: string
    tools?: Array<{
      function?: {
        name: string
        description?: string
        parameters?: any
      }
      type?: string
    }>
  }
}

export async function fetchVAPICalls(apiKey: string): Promise<VAPICall[]> {
  const response = await fetch(`${VAPI_BASE_URL}/call`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch calls. Check your API Key.')
  }

  const data = await response.json()
  return Array.isArray(data) ? data : (data.results || [])
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
  const response = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch assistant details')
  }

  return await response.json()
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

  if (call.messages) {
    call.messages.forEach(msg => {
      if (msg.toolCalls) {
        msg.toolCalls.forEach(tc => {
          toolCalls.push({
            name: tc.function.name,
            arguments: tc.function.arguments,
          })
        })
      }
    })
  }

  if (call.transcript) {
    call.transcript.forEach(msg => {
      if (msg.toolCalls) {
        msg.toolCalls.forEach(tc => {
          toolCalls.push({
            name: tc.function.name,
            arguments: tc.function.arguments,
          })
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
      totalCost: 0
    }
  }

  let transferred = 0
  let live = 0
  let totalCost = 0

  calls.forEach(call => {
    totalCost += (call.cost || 0)

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
    totalCost: parseFloat(totalCost.toFixed(2))
  }
}

