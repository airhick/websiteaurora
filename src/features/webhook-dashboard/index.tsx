import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, Loader2, CheckCircle2, XCircle, Trash2, Phone, Clock, MessageSquare } from 'lucide-react'
import { getCustomerAgents } from '@/lib/customer-agents'
import { getCustomerId } from '@/lib/vapi-api-key'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CallLog {
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
}

const topNav = [
  { title: 'Dashboard', url: '/dashboard' },
  { title: 'Webhook', url: '/webhook' },
]

export function WebhookDashboard() {
  const { user } = useAuthStore((state) => state.auth)
  const [calls, setCalls] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const customerIdRef = useRef<number | null>(null)

  // Get customer ID
  useEffect(() => {
    const customerId = getCustomerId()
    customerIdRef.current = customerId
  }, [])

  // Load previous calls based on customer's agent IDs
  useEffect(() => {
    const loadCalls = async () => {
      const customerId = customerIdRef.current
      if (!customerId) {
        setIsLoading(false)
        return
      }

      try {
        // Get agent IDs for this customer
        const agentIds = await getCustomerAgents(customerId)
        console.log('[WebhookDashboard] Agent IDs:', agentIds)

        if (agentIds.length === 0) {
          console.warn('[WebhookDashboard] No agent IDs found for customer')
          setCalls([])
          setIsLoading(false)
          return
        }

        // Fetch call logs where assistant_id matches any of the agent IDs
        const { data, error } = await supabase
          .from('call_logs')
          .select('*')
          .in('assistant_id', agentIds)
          .order('started_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) {
          console.error('[WebhookDashboard] Error loading calls:', error)
          setCalls([])
        } else {
          console.log(`[WebhookDashboard] Loaded ${data?.length || 0} calls`)
          setCalls(data || [])
        }
      } catch (error) {
        console.error('[WebhookDashboard] Error loading calls:', error)
        setCalls([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCalls()
  }, [])

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'Unknown date'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
      }
    }

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'Unknown time'
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const extractTranscript = (transcript: any): string => {
    if (!transcript) return 'No transcript available'
    
    // Handle different transcript formats
    if (Array.isArray(transcript)) {
      return transcript.map((t: any) => t.content || t.text || JSON.stringify(t)).join('\n')
    }
    
    if (typeof transcript === 'string') {
      return transcript
    }
    
    if (transcript.content) {
      return transcript.content
    }
    
    return JSON.stringify(transcript)
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Incoming Calls</h1>
              <p className="text-muted-foreground">
                Past calls where users requested to be transferred to a human agent
              </p>
            </div>
            <div className="flex items-center gap-2">
              {customerIdRef.current && (
                <Badge variant="outline">
                  Customer ID: {customerIdRef.current}
                </Badge>
              )}
              {calls.length > 0 && (
                <Badge variant="secondary">
                  {calls.length} call{calls.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <h2 className="text-xl font-bold">Previous Calls</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                All calls handled by your AI assistants, including transcript, summary, duration, and timestamps.
              </p>

              {isLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : calls.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground italic border-dashed">
                    No calls found yet. Calls will appear here once they are synced to the database.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {calls.map((call) => {
                    const transcript = extractTranscript(call.transcript)
                    const summary = call.summary || 'No summary available'
                    const duration = formatDuration(call.duration)
                    const dateTime = formatDateTime(call.started_at || call.created_at)
                    const time = formatTime(call.started_at || call.created_at)
                    
                    return (
                      <Card key={call.id} className="overflow-hidden">
                        <div className="border-b bg-muted/50 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <Badge variant={call.status === 'ended' ? 'default' : 'destructive'}>
                                  {call.status || 'Unknown'}
                                </Badge>
                                {call.assistant_id && (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {call.assistant_id.substring(0, 8)}...
                                  </Badge>
                                )}
                                {call.customer_number && (
                                  <span className="text-sm font-medium">{call.customer_number}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{dateTime}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Duration: {duration}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-4">
                          {/* AI Summary */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <h4 className="text-sm font-semibold">AI Summary</h4>
                          </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-sm">{summary}</p>
                            </div>
                          </div>

                          {/* Transcript */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Transcript</h4>
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-muted/30">
                              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                            </ScrollArea>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
          </div>
        </div>
      </Main>
    </>
  )
}

