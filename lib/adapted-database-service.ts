// Adapted Database Service for Aurora Dashboard
// This service works with the existing database schema

import { supabase } from './supabase'
import { DashboardConfig } from './dashboard-config'

// Types for the existing database schema
export interface Company {
  id: number
  name: string
  domain?: string
  twilio_phone_number: string
  twilio_phone_sid?: string
  industry?: string
  size?: string
  timezone?: string
  subscription_tier?: string
  hubspot_company_id?: string
  settings?: Record<string, any>
  knowledge_base_id?: string
  created_at?: string
  updated_at?: string
  is_active?: boolean
  email_provider?: string
  calendar_provider?: string
  crm_provider?: string
  email_required: boolean
}

export interface Call {
  id: number
  company_id: number
  customer_id?: number
  twilio_call_sid: string
  twilio_phone_number: string
  conversation_id: string
  direction?: string
  status?: string
  transcript?: string
  summary?: string
  intent?: string
  sentiment?: string
  started_at?: string
  ended_at?: string
  duration_seconds?: number
  recording_url?: string
  created_at?: string
  updated_at?: string
  call_metadata?: Record<string, any>
}

export interface Customer {
  id: number
  company_id: number
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  title?: string
  hubspot_contact_id?: string
  hubspot_company_id?: string
  created_at?: string
  updated_at?: string
  last_contacted?: string
}

export interface CallToolsUsage {
  id: number
  call_id: number
  tool_name: string
  tool_input?: Record<string, any>
  tool_output?: string
  execution_time_ms?: number
  success?: boolean
  error_message?: string
  created_at?: string
}

// Adapted database service class
export class AdaptedDatabaseService {
  private companyId: number

  constructor(companyId: number) {
    this.companyId = companyId
  }

  // Company management
  async getCompany(): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', this.companyId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching company:', error)
      return null
    }
    return data
  }

  // Get all companies for the selector
  async getAllCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching companies:', error)
      return []
    }
    return data || []
  }

  // Call management
  async getCalls(limit: number = 50, offset: number = 0): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching calls:', error)
      return []
    }
    return data || []
  }

  async getRecentCalls(limit: number = 10): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent calls:', error)
      return []
    }
    return data || []
  }

  async getCallsByDateRange(startDate: Date, endDate: Date): Promise<Call[]> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('company_id', this.companyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching calls by date range:', error)
      return []
    }
    return data || []
  }

  async getCallToolsUsage(callId: number): Promise<CallToolsUsage[]> {
    const { data, error } = await supabase
      .from('call_tools_usage')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching call tools usage:', error)
      return []
    }
    return data || []
  }

  // Customer management
  async getCustomers(limit: number = 50): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }
    return data || []
  }

  // Analytics and metrics
  async getCallStats(): Promise<{
    totalCalls: number
    completedCalls: number
    failedCalls: number
    avgDuration: number
    successRate: number
  }> {
    const { data: calls, error } = await supabase
      .from('calls')
      .select('status, duration_seconds')
      .eq('company_id', this.companyId)

    if (error) {
      console.error('Error fetching call stats:', error)
      return {
        totalCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        avgDuration: 0,
        successRate: 0
      }
    }

    const totalCalls = calls?.length || 0
    const completedCalls = calls?.filter((call: any) => call.status === 'completed').length || 0
    const failedCalls = calls?.filter((call: any) => call.status === 'failed').length || 0
    
    const totalDuration = calls?.reduce((sum: number, call: any) => sum + (call.duration_seconds || 0), 0) || 0
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
    
    const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      avgDuration,
      successRate
    }
  }

  async getCallTypesDistribution(): Promise<Array<{
    type: string
    count: number
    percentage: number
  }>> {
    const { data: calls, error } = await supabase
      .from('calls')
      .select('intent')
      .eq('company_id', this.companyId)
      .not('intent', 'is', null)

    if (error) {
      console.error('Error fetching call types:', error)
      return []
    }

    const typeMap = new Map<string, number>()
    calls?.forEach((call: any) => {
      if (call.intent) {
        typeMap.set(call.intent, (typeMap.get(call.intent) || 0) + 1)
      }
    })

    const totalCalls = Array.from(typeMap.values()).reduce((sum, count) => sum + count, 0)
    
    return Array.from(typeMap.entries()).map(([type, count]) => ({
      type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: totalCalls > 0 ? Number(((count / totalCalls) * 100).toFixed(1)) : 0
    }))
  }

  async getHourlyDistribution(): Promise<Array<{
    hour: string
    calls: number
  }>> {
    const { data: calls, error } = await supabase
      .from('calls')
      .select('created_at')
      .eq('company_id', this.companyId)

    if (error) {
      console.error('Error fetching hourly distribution:', error)
      return []
    }

    const hourlyMap = new Map<number, number>()
    calls?.forEach((call: any) => {
      if (call.created_at) {
        const hour = new Date(call.created_at).getHours()
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
      }
    })

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
      calls: hourlyMap.get(hour) || 0
    }))
  }

  async getWeeklyCalls(): Promise<Array<{
    day: string
    calls: number
    duration: number
  }>> {
    const weeklyCalls = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const dayCalls = await this.getCallsByDateRange(startOfDay, endOfDay)
      const totalDuration = dayCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0)
      
      weeklyCalls.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calls: dayCalls.length,
        duration: totalDuration
      })
    }

    return weeklyCalls
  }

  // Dashboard data aggregation
  async getDashboardData(): Promise<DashboardConfig> {
    try {
      const stats = await this.getCallStats()
      const callTypes = await this.getCallTypesDistribution()
      const hourlyData = await this.getHourlyDistribution()
      const weeklyCalls = await this.getWeeklyCalls()
      const recentCalls = await this.getRecentCalls(5)

      // Calculate peak hour
      const peakHourData = hourlyData.reduce((max, current) => 
        current.calls > max.calls ? current : max, 
        { hour: 'N/A', calls: 0 }
      )
      const peakHour = peakHourData.calls > 0 ? peakHourData.hour : 'N/A'

      // Get top call type
      const topCallType = callTypes.length > 0 ? callTypes[0].type : 'N/A'

      // Format recent calls
      const formattedRecentCalls = recentCalls.map(call => ({
        time: call.created_at ? new Date(call.created_at).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : 'Unknown',
        type: call.intent ? call.intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown',
        duration: this.formatDuration(call.duration_seconds || 0),
        status: call.status === 'completed' ? 'Completed' : 
                call.status === 'failed' ? 'Failed' : 'Completed' as 'Completed' | 'Failed' | 'Transferred'
      }))

      return {
        hasData: stats.totalCalls > 0,
        callStats: {
          totalCalls: stats.totalCalls,
          todayCalls: await this.getTodayCallsCount(),
          avgCallDuration: this.formatDuration(stats.avgDuration),
          successRate: Number(stats.successRate.toFixed(1)),
          peakHour,
          topCallType
        },
        weeklyCalls,
        callTypes,
        hourlyData,
        recentCalls: formattedRecentCalls,
        growthMetrics: {
          totalCallsGrowth: 'N/A', // Would need historical data to calculate
          todayCallsGrowth: 'N/A',
          avgDurationGrowth: 'N/A',
          successRateGrowth: 'N/A'
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      return {
        hasData: false,
        callStats: {
          totalCalls: 0,
          todayCalls: 0,
          avgCallDuration: '0m 0s',
          successRate: 0,
          peakHour: 'N/A',
          topCallType: 'N/A'
        },
        weeklyCalls: [],
        callTypes: [],
        hourlyData: [],
        recentCalls: [],
        growthMetrics: {
          totalCallsGrowth: 'N/A',
          todayCallsGrowth: 'N/A',
          avgDurationGrowth: 'N/A',
          successRateGrowth: 'N/A'
        }
      }
    }
  }

  private async getTodayCallsCount(): Promise<number> {
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const todayCalls = await this.getCallsByDateRange(startOfDay, endOfDay)
    return todayCalls.length
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Test data generation (for development)
  async generateTestData(): Promise<Call[]> {
    const testCalls = [
      {
        company_id: this.companyId,
        twilio_call_sid: `test_call_${Date.now()}_1`,
        twilio_phone_number: '+1-555-0123',
        conversation_id: `conv_${Date.now()}_1`,
        direction: 'inbound',
        status: 'completed',
        transcript: 'Hello, I need help with booking an appointment.',
        summary: 'Customer requested appointment booking',
        intent: 'appointment_booking',
        sentiment: 'positive',
        started_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        ended_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        duration_seconds: 240,
        call_metadata: { test_data: true }
      },
      {
        company_id: this.companyId,
        twilio_call_sid: `test_call_${Date.now()}_2`,
        twilio_phone_number: '+1-555-0124',
        conversation_id: `conv_${Date.now()}_2`,
        direction: 'inbound',
        status: 'completed',
        transcript: 'I have a question about your services.',
        summary: 'General inquiry about services',
        intent: 'general_inquiry',
        sentiment: 'neutral',
        started_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        ended_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        duration_seconds: 300,
        call_metadata: { test_data: true }
      },
      {
        company_id: this.companyId,
        twilio_call_sid: `test_call_${Date.now()}_3`,
        twilio_phone_number: '+1-555-0125',
        conversation_id: `conv_${Date.now()}_3`,
        direction: 'inbound',
        status: 'failed',
        transcript: 'I need technical support.',
        summary: 'Technical support request',
        intent: 'support_request',
        sentiment: 'negative',
        started_at: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        ended_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        duration_seconds: 300,
        call_metadata: { test_data: true }
      }
    ]

    const createdCalls = []
    for (const call of testCalls) {
      const { data, error } = await supabase
        .from('calls')
        .insert(call)
        .select()
        .single()

      if (!error && data) {
        createdCalls.push(data)
      }
    }

    return createdCalls
  }
}

// Export factory function
export function createAdaptedDatabaseService(companyId: number): AdaptedDatabaseService {
  return new AdaptedDatabaseService(companyId)
}
