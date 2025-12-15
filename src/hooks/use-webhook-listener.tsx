import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useWebhookNotificationsStore, type WebhookNotification } from '@/stores/webhook-notifications-store'
import { getCustomerId } from '@/lib/vapi-api-key'

/**
 * Hook to listen for webhook events in real-time and add them to the notifications store
 * Only listens for events matching the current dashboard's customer_id
 */
export function useWebhookListener() {
  const { addNotification } = useWebhookNotificationsStore()
  const channelRef = useRef<any>(null)
  const customerIdRef = useRef<number | null>(null)

  // Get customer ID using the centralized function
  useEffect(() => {
    const customerId = getCustomerId()
    customerIdRef.current = customerId
  }, [])

  // Setup Realtime subscription - only for this customer's events
  // DELAYED to not block initial page load
  useEffect(() => {
    // Delay webhook listener by 1 second to let critical data load first
    const timeout = setTimeout(() => {
      const customerId = customerIdRef.current
      if (!customerId) {
        return
      }

      const channel = supabase
        .channel(`webhook-listener-${customerId}`) // Unique channel per customer
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_events',
            filter: `customer_id=eq.${customerId}`, // Only listen to this customer's events
          },
          (payload) => {
            const newEvent = payload.new as WebhookNotification
            
            // Double-check that the event belongs to this customer
            if (newEvent.customer_id === customerId) {
              addNotification(newEvent)
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    }, 1000) // Delay by 1 second

    return () => {
      clearTimeout(timeout)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [addNotification])
}

