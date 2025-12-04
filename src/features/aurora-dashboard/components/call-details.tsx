import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVAPICalls } from '@/hooks/use-vapi-calls'
import { fetchVAPICallDetail } from '@/lib/vapi'
import { Badge } from '@/components/ui/badge'
import { PhoneIncoming, PhoneOutgoing, MessageSquare, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function CallDetails() {
  const { calls } = useVAPICalls()
  const user = useAuthStore((state) => state.auth.user)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const apiKey = user?.user_metadata?.vapi_api_key || localStorage.getItem('vapi_private_key') || ''

  // Get incoming calls
  const incomingCalls = calls.filter(call => call.type === 'inboundPhoneCall').slice(0, 5)

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

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5" />
            Recent Incoming Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incomingCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No incoming calls yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomingCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => loadCallDetail(call.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <PhoneIncoming className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {call.customer?.number || 'Unknown number'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(call.startedAt || call.createdAt)}
                      </div>
                    </div>
                    <Badge variant={call.status === 'ended' ? 'default' : 'destructive'}>
                      {call.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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

