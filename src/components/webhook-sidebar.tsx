import { useEffect } from 'react'
import { useWebhookNotificationsStore } from '@/stores/webhook-notifications-store'
import { getCustomerId } from '@/lib/vapi-api-key'
import { Button } from '@/components/ui/button'
import { Phone, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/translations'

export function WebhookSidebar() {
  const { currentNotification, clearCurrentNotification } = useWebhookNotificationsStore()
  const currentCustomerId = getCustomerId()
  const t = useTranslation()
  
  // Only show sidebar if notification belongs to current customer
  const isVisible = !!currentNotification && 
                   currentNotification.customer_id === currentCustomerId

  // Debug logging
  useEffect(() => {
    console.log('[WebhookSidebar] State:', {
      hasNotification: !!currentNotification,
      currentNotification,
      currentCustomerId,
      isVisible,
      notificationCustomerId: currentNotification?.customer_id,
    })
  }, [currentNotification, currentCustomerId, isVisible])

  const extractCallSummary = (payload: any): string => {
    try {
      // If payload is null or undefined, return default
      if (!payload) {
        return t.webhook.noSummaryAvailable
      }
      
      // If payload is directly a string, return it (this is the most common case)
      if (typeof payload === 'string') {
        const trimmed = payload.trim()
        if (trimmed.length > 0) {
          return trimmed
        }
      }
      
      // Try to parse if it's a JSON string
      let parsedPayload = payload
      if (typeof payload === 'string') {
        try {
          parsedPayload = JSON.parse(payload)
        } catch {
          // If parsing fails, it's just a plain string, return it
          return payload.trim()
        }
      }
      
      // Now try to find summary in various possible locations in the parsed payload
      
      // Direct summary fields
      if (parsedPayload?.summary) return String(parsedPayload.summary)
      if (parsedPayload?.call_summary) return String(parsedPayload.call_summary)
      if (parsedPayload?.callSummary) return String(parsedPayload.callSummary)
      
      // Summary in nested objects
      if (parsedPayload?.message?.summary) return String(parsedPayload.message.summary)
      if (parsedPayload?.artifact?.summary) return String(parsedPayload.artifact.summary)
      if (parsedPayload?.data?.summary) return String(parsedPayload.data.summary)
      
      // Summary in analysis
      if (parsedPayload?.analysis?.summary) return String(parsedPayload.analysis.summary)
      if (parsedPayload?.message?.analysis?.summary) return String(parsedPayload.message.analysis.summary)
      
      // Try to extract from messages array (last message)
      if (parsedPayload?.message?.artifact?.messages) {
        const msgs = parsedPayload.message.artifact.messages
        if (Array.isArray(msgs) && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg?.message) return String(lastMsg.message)
          if (lastMsg?.content) return String(lastMsg.content)
        }
      }
      
      // Try messages array directly
      if (parsedPayload?.messages && Array.isArray(parsedPayload.messages) && parsedPayload.messages.length > 0) {
        const lastMsg = parsedPayload.messages[parsedPayload.messages.length - 1]
        if (lastMsg?.message) return String(lastMsg.message)
        if (lastMsg?.content) return String(lastMsg.content)
      }
      
      // Fallback to other message fields
      if (parsedPayload?.message) return String(parsedPayload.message)
      if (parsedPayload?.content) return String(parsedPayload.content)
      if (parsedPayload?.text) return String(parsedPayload.text)
      
      // Action or reason fields
      if (parsedPayload?.action) return `Action: ${parsedPayload.action}`
      if (parsedPayload?.reason) return `Reason: ${parsedPayload.reason}`
      if (parsedPayload?.customer_request) return `Customer requested: ${parsedPayload.customer_request}`
      
      // Default message
      return t.webhook.noSummaryAvailable
    } catch (e) {
      console.error('Error extracting call summary:', e, 'Payload:', payload)
      // Last resort: try to return payload as string
      if (payload && typeof payload === 'string') {
        return payload.trim()
      }
      return t.webhook.summaryExtractionError
    }
  }

  const handlePickUpCall = async () => {
    if (!currentNotification?.call_id) {
      toast.error(t.webhook.noCallIdAvailable)
      return
    }

    const callId = currentNotification.call_id
    const webhookBody = { call_id: callId }

    try {
      // Trigger both webhooks in parallel
      const [response1, response2] = await Promise.allSettled([
        fetch('https://n8n.goreview.fr/webhook-test/pickup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookBody),
        }),
        fetch('https://n8n.goreview.fr/webhook/pickup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookBody),
        }),
      ])

      // Check results
      const testSuccess = response1.status === 'fulfilled' && response1.value.ok
      const prodSuccess = response2.status === 'fulfilled' && response2.value.ok

      if (testSuccess && prodSuccess) {
        toast.success(t.webhook.callPickedUpSuccess)
        console.log('Both pickup webhooks triggered successfully for call:', callId)
      } else if (testSuccess || prodSuccess) {
        toast.warning(t.webhook.callPickedUpPartial)
        console.warn('Partial success - one webhook failed')
      } else {
        toast.error(t.webhook.callPickupError)
        console.error('Both webhooks failed')
      }

      // Log detailed results
      if (response1.status === 'fulfilled') {
        console.log('Webhook-test/pickup response:', response1.value.status, response1.value.statusText)
      } else {
        console.error('Webhook-test/pickup error:', response1.reason)
      }

      if (response2.status === 'fulfilled') {
        console.log('Webhook/pickup response:', response2.value.status, response2.value.statusText)
      } else {
        console.error('Webhook/pickup error:', response2.reason)
      }
    } catch (error) {
      console.error('Error triggering pickup webhooks:', error)
      toast.error(t.webhook.webhookError)
    }
  }

  if (!isVisible || !currentNotification) return null

  const callSummary = extractCallSummary(currentNotification.payload)

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-background border-l shadow-lg z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <Card className="h-full rounded-none border-0 shadow-none flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              {t.webhook.incomingCall}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {t.webhook.new}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCurrentNotification}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t.webhook.callSummary}</p>
                <div className="text-sm leading-relaxed">
                  <MarkdownRenderer content={callSummary} />
                </div>
              </div>

              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <span>
                  {t.webhook.receivedAt} {new Date(currentNotification.created_at).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                {currentNotification.call_id && (
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                    {t.webhook.callId} {currentNotification.call_id}
                  </span>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex flex-col gap-2 pt-4 border-t mt-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={clearCurrentNotification}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              {t.webhook.close}
            </Button>
            <Button
              onClick={handlePickUpCall}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              {t.webhook.pickUpCall}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

