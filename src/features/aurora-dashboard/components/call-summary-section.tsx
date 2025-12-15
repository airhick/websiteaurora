import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCallSummaryStore } from '@/stores/call-summary-store'
import { X, MessageSquare, Phone, Calendar, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export function CallSummarySection() {
  const { selectedCall, clearSelectedCall } = useCallSummaryStore()

  if (!selectedCall) {
    return null
  }

  return (
    <div id="call-summary-section" className="mt-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Call Summary
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSelectedCall}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Call Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {selectedCall.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedCall.phoneNumber}</span>
                </div>
              )}
              {selectedCall.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{selectedCall.date}</span>
                </div>
              )}
              {selectedCall.status && (
                <Badge variant={selectedCall.status === 'ended' ? 'default' : 'destructive'}>
                  {selectedCall.status}
                </Badge>
              )}
            </div>

            {/* Summary Content */}
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {selectedCall.loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading summary...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCall.summary || 'No summary available for this call.'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

