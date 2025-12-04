import { createClient } from '@supabase/supabase-js'

// Use provided Supabase credentials or fallback to env vars
// Note: Always use the anon/public key for client-side, never the secret key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oknakvgnwxlkvhwmocno.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BcC5d3MA2VslQJHRoXdy1Q_yvwEEgp2'

// Create a dummy client if Supabase is not configured
const createDummyClient = () => {
  return createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-project-url' &&
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase is not properly configured. Authentication features will be disabled.')
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file')
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createDummyClient()

export const isSupabaseEnabled = isSupabaseConfigured

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          title: string | null
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          title?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

