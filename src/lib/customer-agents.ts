/**
 * Customer Agents Utilities
 * Handles parsing and managing agent IDs from customers table
 */

import { supabase } from './supabase'

export interface ParsedAgent {
  language: string
  agentId: string
}

/**
 * Parse agents string from customers table
 * New format: "agent-id1;agent-id2;agent-id3" separated by semicolons
 * Old format (still supported): "LANG:agent-id" separated by newlines or commas
 * Example: "3413568f-9f14-42fa-816e-41db9699f7e3;e3d981e5-a14e-4a2b-a4fb-46e53654dbdf;50545a81-f27b-43bc-8126-75773ba8e0e4"
 */
export function parseAgents(agentsString: string | null): ParsedAgent[] {
  if (!agentsString) return []
  
  const agents: ParsedAgent[] = []
  
  // Try new format first (semicolon-separated)
  if (agentsString.includes(';')) {
    const agentIds = agentsString.split(';').map(id => id.trim()).filter(Boolean)
    for (const agentId of agentIds) {
      agents.push({
        language: 'UNKNOWN', // No language info in new format
        agentId: agentId,
      })
    }
    return agents
  }
  
  // Fallback to old format (LANG:agent-id)
  const lines = agentsString.split(/\n|,|\r\n/).map(line => line.trim()).filter(Boolean)
  
  for (const line of lines) {
    const match = line.match(/^([A-Z]{2,3}):(.+)$/)
    if (match) {
      agents.push({
        language: match[1],
        agentId: match[2],
      })
    } else if (line && !line.includes(':')) {
      // If it's just an agent ID without language prefix, accept it
      agents.push({
        language: 'UNKNOWN',
        agentId: line,
      })
    }
  }
  
  return agents
}

/**
 * Extract agent IDs from agents string
 * Matches the Python script logic exactly: split by semicolon, strip whitespace, filter empty
 */
export function extractAgentIds(agentsString: string | null): string[] {
  if (!agentsString) {
    return []
  }
  
  // Match Python: agent_ids = raw_agents.split(';')
  const agentIds = agentsString.split(';')
  
  // Match Python: clean_id = agent_id.strip() and if not clean_id: continue
  const cleaned = agentIds
    .map(id => id.trim())
    .filter(Boolean) // Filter out empty strings
  
  return cleaned
}

/**
 * Get customer agents from Supabase for a specific customer ID
 * Uses RPC function to bypass RLS (similar to authenticate_customer)
 * Matches the Python script approach: fetch ONLY the 'agents' column where id = customerId
 */
export async function getCustomerAgents(customerId: number): Promise<string[]> {
  try {
    // Convert customerId to number to ensure type match (database uses BIGINT)
    const numericId = typeof customerId === 'string' ? parseInt(customerId, 10) : customerId
    
    if (isNaN(numericId)) {
      console.error(`Invalid customer ID: ${customerId}`)
      return []
    }
    
    // Use RPC function to bypass RLS (similar to authenticate_customer)
    const { data, error } = await supabase
      .rpc('get_customer_agents', {
        p_customer_id: numericId
      })
    
    if (error) {
      // If function doesn't exist, provide helpful error message
      if (error.code === '42883' || 
          error.message?.includes('function') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('get_customer_agents')) {
        console.error(`Function not found. Please run supabase-get-customer-agents-function.sql in Supabase SQL Editor.`)
        return []
      }
      console.error(`Error calling RPC function:`, error)
      return []
    }
    
    // RPC function returns the agents string directly (or NULL)
    if (!data || data === null) {
      return []
    }
    
    // Match Python script: split by semicolon, strip whitespace, filter empty
    const agentIds = extractAgentIds(data)
    
    return agentIds
  } catch (error: any) {
    console.error(`Exception in getCustomerAgents:`, error)
    return []
  }
}

