import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVAPICalls } from '@/hooks/use-vapi-calls'
import { fetchVAPICallDetail } from '@/lib/vapi'
import { Badge } from '@/components/ui/badge'
import { PhoneIncoming, MessageSquare, RefreshCw, Eye, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useTranslation } from '@/lib/translations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

interface CallSummary {
  callId: string
  summary: string
  loading: boolean
}

export function CallDetails() {
  const { calls, loading: callsLoading } = useVAPICalls()
  const user = useAuthStore((state) => state.auth.user)
  const t = useTranslation()
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, CallSummary>>({})

  const apiKey = user?.user_metadata?.vapi_api_key || localStorage.getItem('vapi_private_key') || ''

  // Get incoming calls (up to 10)
  const incomingCalls = calls.filter(call => call.type === 'inboundPhoneCall').slice(0, 10)

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const loadCallDetail = async (callId: string) => {
    if (!apiKey) return

    setLoading(true)
    try {
      const detail = await fetchVAPICallDetail(apiKey, callId)
      setSelectedCall(detail)
    } catch (error) {
      console.error('Failed to load call detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCallSummary = async (call: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the dialog
    
    // If already expanded, collapse it
    if (expandedSummaries[call.id]) {
      const newSummaries = { ...expandedSummaries }
      delete newSummaries[call.id]
      setExpandedSummaries(newSummaries)
      return
    }

    if (!apiKey) return

    // Set loading state
    setExpandedSummaries({
      ...expandedSummaries,
      [call.id]: { callId: call.id, summary: '', loading: true }
    })

    try {
      const detail = await fetchVAPICallDetail(apiKey, call.id)
      const summary = detail.analysis?.summary || t.calls.noSummary
      
      setExpandedSummaries({
        ...expandedSummaries,
        [call.id]: { callId: call.id, summary, loading: false }
      })
    } catch (error) {
      console.error('Failed to load call summary:', error)
      setExpandedSummaries({
        ...expandedSummaries,
        [call.id]: { callId: call.id, summary: t.calls.failedToLoad, loading: false }
      })
    }
  }

  if (callsLoading && incomingCalls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5" />
            Recent Incoming Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px] w-full">
            <div className="space-y-2 pr-4">
              {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-8 w-12 rounded" />
                </div>
              </div>
            ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5" />
            {t.calls.recentCalls}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomingCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t.calls.previousCalls}</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px] w-full">
              <div className="space-y-2 pr-4">
                {incomingCalls.map((call) => {
                const summary = expandedSummaries[call.id]
                const isExpanded = !!summary

                return (
                  <div key={call.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 hover:bg-accent transition-colors">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => loadCallDetail(call.id)}
                >
                    <PhoneIncoming className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {call.customer?.number || 'Unknown number'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                            {formatTime(call.startedAt || call.createdAt)} {call.status === 'ended' ? t.calls.ended : ''}
                      </div>
                    </div>
                    <Badge variant={call.status === 'ended' ? 'default' : 'destructive'}>
                      {call.status}
                    </Badge>
                  </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 flex-shrink-0"
                        onClick={(e) => loadCallSummary(call, e)}
                        disabled={summary?.loading}
                      >
                        {summary?.loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : isExpanded ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            {t.calls.see}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Inline Summary Section */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">{t.calls.callSummary}</span>
                        </div>
                        {summary.loading ? (
                          <div className="flex items-center justify-center py-4">
                            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">{t.calls.loadingSummary}</span>
                          </div>
                        ) : (
                          <ScrollArea className="h-[200px] w-full">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {summary.summary || t.calls.noSummary}
                            </p>
                          </ScrollArea>
                        )}
                      </div>
                    )}
                </div>
                )
              })}
            </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
            <DialogDescription>
              {selectedCall?.id}
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedCall ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Status</h4>
                  <Badge>{selectedCall.status}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Type</h4>
                  <p className="text-sm">{selectedCall.type}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Duration</h4>
                  <p className="text-sm">{selectedCall.duration ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s` : '-'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Cost</h4>
                  <p className="text-sm">${selectedCall.cost?.toFixed(4) || '0.0000'}</p>
                </div>
              </div>

              {selectedCall.analysis?.summary && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Summary
                  </h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedCall.analysis.summary}</p>
                </div>
              )}

              {selectedCall.messages && selectedCall.messages.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Messages</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCall.messages.map((msg: any, idx: number) => (
                      <div key={idx} className="bg-muted p-3 rounded-lg">
                        <div className="text-xs font-medium mb-1">{msg.role}</div>
                        <div className="text-sm">{msg.content}</div>
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Tools: {msg.toolCalls.map((tc: any) => tc.function.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

