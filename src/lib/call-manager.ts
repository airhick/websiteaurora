/**
 * Call Manager Service
 * Handles updating VAPI assistant with call log context and initiating calls
 */

import { getCustomerAgents } from './customer-agents'
import { getCustomerId } from './vapi-api-key'
import { supabase } from './supabase'
import type { CallLog } from './call-logs-sync'

const VAPI_BASE_URL = 'https://api.vapi.ai'
const CALL_MANAGER_ASSISTANT_ID = '3413568f-9f14-42fa-816e-41db9699f7e3'
const VAPI_PRIVATE_KEY = '9d09c2ec-4223-41af-a1c9-8bb097b8e5ef'

/**
 * Fetch call logs for customer's agents from Supabase
 */
async function fetchCallLogsForContext(customerId: number): Promise<CallLog[]> {
  try {
    // Get customer's agent IDs
    const agentIds = await getCustomerAgents(customerId)
    
    if (agentIds.length === 0) {
      console.warn('No agents found for customer', customerId)
      return []
    }

    // Fetch call logs from Supabase
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .in('assistant_id', agentIds)
      .order('started_at', { ascending: false })
      .limit(100) // Limit to most recent 100 calls for context

    if (error) {
      console.error('Error fetching call logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exception fetching call logs:', error)
    return []
  }
}

/**
 * Format call logs into context string for assistant
 */
function formatCallLogsAsContext(callLogs: CallLog[]): string {
  if (callLogs.length === 0) {
    return 'No previous call logs available.'
  }

  const contextParts: string[] = []
  contextParts.push(`You are a personalized call manager assistant. You have access to ${callLogs.length} previous call logs from this customer's AI receptionist agents.`)
  contextParts.push('\n\n## Previous Call Logs:\n')

  callLogs.forEach((log, index) => {
    const date = log.started_at 
      ? new Date(log.started_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Unknown date'
    
    const duration = log.duration 
      ? `${Math.floor(log.duration / 60)}m ${log.duration % 60}s`
      : 'Unknown duration'
    
    contextParts.push(`\n### Call ${index + 1} - ${date} (Duration: ${duration})`)
    
    if (log.summary) {
      contextParts.push(`Summary: ${log.summary}`)
    }
    
    if (log.transcript && Array.isArray(log.transcript)) {
      const transcriptText = log.transcript
        .map((msg: any) => {
          const role = msg.role || 'unknown'
          const content = msg.content || ''
          return `${role}: ${content}`
        })
        .join('\n')
      
      if (transcriptText.trim()) {
        contextParts.push(`Transcript:\n${transcriptText}`)
      }
    } else if (log.messages && Array.isArray(log.messages)) {
      const messagesText = log.messages
        .map((msg: any) => {
          const role = msg.role || 'unknown'
          const content = msg.content || ''
          return `${role}: ${content}`
        })
        .join('\n')
      
      if (messagesText.trim()) {
        contextParts.push(`Messages:\n${messagesText}`)
      }
    }
    
    if (log.ended_reason) {
      contextParts.push(`Ended reason: ${log.ended_reason}`)
    }
    
    contextParts.push('---')
  })

  contextParts.push('\n\n## Instructions:')
  contextParts.push('When the user asks about a previous call, use the information above to provide accurate details.')
  contextParts.push('You can reference specific calls by their date, duration, or content.')
  contextParts.push('If asked about decisions made by other agents, explain them based on the call logs above.')
  contextParts.push('Be helpful, concise, and accurate when referencing past calls.')

  return contextParts.join('\n')
}

/**
 * Update VAPI assistant with call log context
 */
export async function updateCallManagerAssistant(): Promise<{ success: boolean; error?: string }> {
  try {
    const customerId = getCustomerId()
    if (!customerId) {
      return { success: false, error: 'Customer ID not found' }
    }

    // Fetch call logs
    const callLogs = await fetchCallLogsForContext(customerId)
    
    // Format as context
    const context = formatCallLogsAsContext(callLogs)

    // First, fetch the current assistant to get its model configuration
    const getResponse = await fetch(`${VAPI_BASE_URL}/assistant/${CALL_MANAGER_ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!getResponse.ok) {
      const errorText = await getResponse.text()
      console.error('Failed to fetch assistant:', errorText)
      return { success: false, error: `Failed to fetch assistant: ${getResponse.status} ${errorText}` }
    }

    const assistant = await getResponse.json()
    const currentModel = assistant.model || {}

    // Update assistant with system message in messages array
    // VAPI API doesn't accept systemMessage property, only messages array
    // Preserve existing model configuration (provider, model name, etc.)
    const updatePayload: any = {
      model: {
        ...currentModel, // Preserve existing model config (provider, model name, etc.)
      }
    }

    // Remove systemMessage properties if they exist (VAPI doesn't accept them)
    delete updatePayload.model.systemMessage
    delete updatePayload.model.system_message

    // Update messages array to include system message
    if (currentModel.messages && Array.isArray(currentModel.messages)) {
      // Find and update system message, or add it if not present
      const messages = [...currentModel.messages]
      const systemIndex = messages.findIndex((msg: any) => msg.role === 'system')
      if (systemIndex >= 0) {
        messages[systemIndex] = { role: 'system', content: context }
      } else {
        messages.unshift({ role: 'system', content: context })
      }
      updatePayload.model.messages = messages
    } else {
      // If no messages array, create one with system message
      updatePayload.model.messages = [
        { role: 'system', content: context }
      ]
    }

    const response = await fetch(`${VAPI_BASE_URL}/assistant/${CALL_MANAGER_ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to update assistant:', errorText)
      return { success: false, error: `Failed to update assistant: ${response.status} ${errorText}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating call manager assistant:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Initiate a phone call with the call manager assistant
 */
export async function initiateCallManagerCall(phoneNumber: string): Promise<{ success: boolean; callId?: string; error?: string }> {
  try {
    // First, update the assistant with latest context
    const updateResult = await updateCallManagerAssistant()
    if (!updateResult.success) {
      return { success: false, error: `Failed to update assistant: ${updateResult.error}` }
    }

    // Initiate the call - VAPI API format
    const response = await fetch(`${VAPI_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: CALL_MANAGER_ASSISTANT_ID,
        customer: {
          number: phoneNumber
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to initiate call:', errorText)
      return { success: false, error: `Failed to initiate call: ${response.status} ${errorText}` }
    }

    const data = await response.json()
    return { success: true, callId: data.id }
  } catch (error: any) {
    console.error('Error initiating call manager call:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

