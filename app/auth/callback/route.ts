import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Log errors for debugging
  if (error) {
    console.error('OAuth Error:', error, error_description)
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
      }

      console.log('✅ Successfully authenticated user:', data.user?.email)
      
      // Return response with cookies set
      return response
    } catch (err) {
      console.error('Unexpected error during authentication:', err)
      return NextResponse.redirect(new URL('/?error=unexpected', request.url))
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(new URL('/', request.url))
}

