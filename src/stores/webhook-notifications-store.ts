import { create } from 'zustand'
import { getCustomerId } from '@/lib/vapi-api-key'

export interface WebhookNotification {
  id: number
  customer_id: number
  event_type: string
  payload: any
  created_at: string
  call_id?: string | null
  call_type?: string | null
}

interface WebhookNotificationsState {
  notifications: WebhookNotification[]
  currentNotification: WebhookNotification | null
  addNotification: (notification: WebhookNotification) => void
  removeNotification: (notificationId: number) => void
  clearAllNotifications: () => void
  clearCurrentNotification: () => void
  setCurrentNotification: (notification: WebhookNotification | null) => void
}

export const useWebhookNotificationsStore = create<WebhookNotificationsState>()((set) => ({
  notifications: [],
  currentNotification: null,
  setCurrentNotification: (notification) => set({ currentNotification: notification }),
  clearCurrentNotification: () => set({ currentNotification: null }),
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

    // Check if notification already exists (avoid duplicates)
    set((state) => {
      const exists = state.notifications.some(n => n.id === notification.id)
      if (exists) {
        console.log('Notification already exists, skipping:', notification.id)
        return state
      }

      // Add new notification to the beginning of the array (most recent first)
      // But we'll display them in reverse order (oldest at top, newest at bottom)
      return {
        notifications: [...state.notifications, notification], // Add to end so newest appears at bottom
      }
    })
  },
  removeNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== notificationId),
    })),
  clearAllNotifications: () =>
    set(() => ({
      notifications: [],
    })),
}))

