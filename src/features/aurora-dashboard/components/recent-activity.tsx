import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useVAPICalls } from '@/hooks/use-vapi-calls'
import { Badge } from '@/components/ui/badge'
import { PhoneIncoming, PhoneOutgoing, ChevronRight, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface RecentActivityProps {
  onStartTest: () => void
}

export function RecentActivity({ onStartTest }: RecentActivityProps) {
  const { calls, loading, refreshCalls } = useVAPICalls()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCalls = calls.filter(call => 
    !searchQuery || call.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10)

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-'
    return new Date(isoString).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📊 Recent Activity</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshCalls}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Loading calls...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="mt-4 text-lg font-medium">No calls yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchQuery ? 'No calls match your search' : 'Start your first call to see activity here'}
            </p>
            {!searchQuery && <Button onClick={onStartTest}>Start Test Call</Button>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by call ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {call.type === 'inboundPhoneCall' ? (
                        <PhoneIncoming className="h-4 w-4 text-blue-500" />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={call.status === 'ended' ? 'default' : 'destructive'}>
                          {call.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {formatTime(call.startedAt || call.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {formatDuration(call.duration)}
                        </span>
                        {call.cost && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-green-600 font-medium">
                              ${call.cost.toFixed(4)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

