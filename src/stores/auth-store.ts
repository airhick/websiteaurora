import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  signOut as authSignOut,
  verifyOrCreateCustomerRecord,
} from '@/lib/auth'

type AuthUser = User

interface AuthState {
  auth: {
    user: AuthUser | null
    session: Session | null
    loading: boolean
    setUser: (user: AuthUser | null) => void
    setSession: (session: Session | null) => void
    setLoading: (loading: boolean) => void
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
    signInWithGoogle: () => Promise<{ error: any }>
    signUpWithEmail: (
      email: string,
      password: string,
      metadata?: { first_name?: string; last_name?: string; phone?: string }
    ) => Promise<{ error: any }>
    signOut: () => Promise<void>
    reset: () => void
    initialize: () => Promise<void>
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  auth: {
    user: null,
    session: null,
    loading: true,
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    setSession: (session) => {
      // Handle both Supabase sessions and custom customer sessions
      let user: AuthUser | null = null
      
      if (session) {
        if (session.user) {
          user = session.user as AuthUser
        } else if ((session as any).user) {
          user = (session as any).user as AuthUser
        }
      }
      
      set((state) => ({ 
        ...state, 
        auth: { 
          ...state.auth, 
          session, 
          user
        } 
      }))
    },
    setLoading: (loading) =>
      set((state) => ({ ...state, auth: { ...state.auth, loading } })),
    signInWithEmail: async (email: string, password: string) => {
      const { data, error } = await signInWithEmail(email, password)
      if (data?.session) {
        get().auth.setSession(data.session)
      }
      return { error }
    },
    signInWithGoogle: async () => {
      const { error } = await signInWithGoogle()
      return { error }
    },
    signUpWithEmail: async (
      email: string,
      password: string,
      metadata?: { first_name?: string; last_name?: string; phone?: string }
    ) => {
      const { data, error } = await signUpWithEmail(email, password, metadata)
      if (data?.session) {
        get().auth.setSession(data.session)
      }
      return { error }
    },
    signOut: async () => {
      await authSignOut()
      get().auth.reset()
    },
    reset: () =>
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null, session: null },
      })),
    initialize: async () => {
      try {
        // Check if Supabase is enabled
        if (!isSupabaseEnabled) {
          console.warn('Supabase is not configured. Skipping auth initialization.')
          get().auth.setLoading(false)
          return
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          // Don't throw on network errors, just log them
          if (error.message?.includes('DNS') || error.message?.includes('network')) {
            console.warn('Supabase connection error:', error.message)
            get().auth.setLoading(false)
            return
          }
          throw error
        }
        
        get().auth.setSession(session)
        
        // Verify customer record exists for authenticated user
        if (session?.user) {
          try {
            await verifyOrCreateCustomerRecord(session.user)
          } catch (err) {
            console.warn('Failed to verify customer record:', err)
          }
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
          get().auth.setSession(session)
          
          // Verify customer record when user signs in
          if (session?.user) {
            try {
              await verifyOrCreateCustomerRecord(session.user)
            } catch (err) {
              console.warn('Failed to verify customer record:', err)
            }
          }
        })
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Don't block the app if auth fails
      } finally {
        get().auth.setLoading(false)
      }
    },
  },
}))
