import { create } from 'zustand'
import { getCustomerId } from '@/lib/vapi-api-key'

export interface WebhookNotification {
  id: number
  customer_id: number
  event_type: string
  payload: any
  created_at: string
  call_id?: string | null
}

interface WebhookNotificationsState {
  notifications: WebhookNotification[]
  currentNotification: WebhookNotification | null
  addNotification: (notification: WebhookNotification) => void
  clearCurrentNotification: () => void
  clearAllNotifications: () => void
}

export const useWebhookNotificationsStore = create<WebhookNotificationsState>()((set) => ({
  notifications: [],
  currentNotification: null,
  addNotification: (notification) => {
    // Verify that the notification belongs to the current customer
    const currentCustomerId = getCustomerId()
    
    if (!currentCustomerId) {
      console.warn('Cannot add notification: no customer ID found')
      return
    }

    if (notification.customer_id !== currentCustomerId) {
      console.warn('Ignoring notification from different customer:', {
        notificationCustomerId: notification.customer_id,
        currentCustomerId,
      })
      return
    }

    // Only add notifications that match the current customer
    set((state) => ({
      notifications: [notification, ...state.notifications],
      currentNotification: notification, // Set as current to show popup
    }))
  },
  clearCurrentNotification: () =>
    set(() => ({
      currentNotification: null,
    })),
  clearAllNotifications: () =>
    set(() => ({
      notifications: [],
      currentNotification: null,
    })),
}))

