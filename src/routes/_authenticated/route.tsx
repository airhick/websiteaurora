import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { loading } = useAuthStore.getState().auth
    
    // Wait for loading to complete
    if (loading) {
      await new Promise((resolve) => {
        const unsubscribe = useAuthStore.subscribe((state) => {
          if (!state.auth.loading) {
            unsubscribe()
            resolve(undefined)
          }
        })
      })
    }

    // Check authentication after loading
    const currentUser = useAuthStore.getState().auth.user
    if (!currentUser) {
      throw redirect({
        to: '/',
        search: {
          redirect: window.location.pathname,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
