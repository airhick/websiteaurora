import { useWebhookNotificationsStore } from '@/stores/webhook-notifications-store'
import { getCustomerId } from '@/lib/vapi-api-key'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Phone, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { toast } from 'sonner'

export function WebhookPopup() {
  const { currentNotification, clearCurrentNotification } = useWebhookNotificationsStore()
  const currentCustomerId = getCustomerId()
  
  // Only show popup if notification belongs to current customer
  const isOpen = !!currentNotification && 
                 currentNotification.customer_id === currentCustomerId

  const extractCallSummary = (payload: any): string => {
    try {
      // If payload is null or undefined, return default
      if (!payload) {
        return 'Nouvel appel entrant - Résumé non disponible'
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
      return 'Nouvel appel entrant - Résumé non disponible'
    } catch (e) {
      console.error('Error extracting call summary:', e, 'Payload:', payload)
      // Last resort: try to return payload as string
      if (payload && typeof payload === 'string') {
        return payload.trim()
      }
      return 'Nouvel appel entrant - Erreur lors de l\'extraction du résumé'
    }
  }

  const handlePickUpCall = async () => {
    if (!currentNotification?.call_id) {
      toast.error('Aucun Call ID disponible pour cette notification')
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
        toast.success('Appel récupéré avec succès')
        console.log('Both pickup webhooks triggered successfully for call:', callId)
      } else if (testSuccess || prodSuccess) {
        toast.warning('Un des webhooks a échoué, mais l\'appel a été récupéré')
        console.warn('Partial success - one webhook failed')
      } else {
        toast.error('Erreur lors de la récupération de l\'appel')
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
      toast.error('Erreur lors de l\'envoi des webhooks')
    }
  }

  if (!currentNotification) return null

  // Debug: log the payload to see its structure
  console.log('WebhookPopup - Full notification:', currentNotification)
  console.log('WebhookPopup - Payload:', currentNotification.payload, 'Type:', typeof currentNotification.payload)
  
  const callSummary = extractCallSummary(currentNotification.payload)
  
  console.log('WebhookPopup - Extracted summary:', callSummary)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && clearCurrentNotification()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Appel entrant
            </DialogTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Nouveau
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Résumé de l'appel:</p>
            <div className="text-base leading-relaxed">
              <MarkdownRenderer content={callSummary} />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Reçu à {new Date(currentNotification.created_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            {currentNotification.call_id && (
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                Call ID: {currentNotification.call_id}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={clearCurrentNotification}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Fermer
          </Button>
          <Button
            onClick={handlePickUpCall}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Phone className="h-4 w-4" />
            Pick up the call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

