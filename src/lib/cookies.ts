/**
 * Cookie utilities for authentication persistence and general cookie management
 */

const COOKIE_NAME = 'aurora_auth_session'

/**
 * Generic cookie utilities
 */

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  try {
    const cookies = document.cookie.split(';')
    const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
    
    if (!cookie) {
      return null
    }
    
    const value = cookie.split('=')[1]
    return decodeURIComponent(value)
  } catch (error) {
    console.error(`Error reading cookie ${name}:`, error)
    return null
  }
}

/**
 * Set a cookie
 */
export function setCookie(
  name: string,
  value: string,
  maxAge?: number,
  options?: {
    path?: string
    domain?: string
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  }
) {
  try {
    const encodedValue = encodeURIComponent(value)
    let cookieString = `${name}=${encodedValue}`
    
    if (maxAge) {
      const expires = new Date(Date.now() + maxAge * 1000).toUTCString()
      cookieString += `; expires=${expires}`
    }
    
    cookieString += `; path=${options?.path || '/'}`
    
    if (options?.domain) {
      cookieString += `; domain=${options.domain}`
    }
    
    if (options?.secure !== false && (options?.secure || window.location.protocol === 'https:')) {
      cookieString += `; Secure`
    }
    
    cookieString += `; SameSite=${options?.sameSite || 'Lax'}`
    
    document.cookie = cookieString
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error)
  }
}

/**
 * Remove a cookie
 */
export function removeCookie(
  name: string,
  options?: {
    path?: string
    domain?: string
  }
) {
  try {
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`
    cookieString += `; path=${options?.path || '/'}`
    
    if (options?.domain) {
      cookieString += `; domain=${options.domain}`
}

    document.cookie = cookieString
  } catch (error) {
    console.error(`Error removing cookie ${name}:`, error)
  }
}

export interface AuthCookie {
  customerId: number
  email: string
  company: string | null
  expiresAt: number
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(data: Omit<AuthCookie, 'expiresAt'>) {
  const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days from now
  const cookieData: AuthCookie = {
    ...data,
    expiresAt,
  }
  
  const cookieValue = encodeURIComponent(JSON.stringify(cookieData))
  const expires = new Date(expiresAt).toUTCString()
  
  // Set cookie with secure flags
  document.cookie = `${COOKIE_NAME}=${cookieValue}; expires=${expires}; path=/; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`
}

/**
 * Get authentication cookie
 */
export function getAuthCookie(): AuthCookie | null {
  try {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(cookie => cookie.trim().startsWith(`${COOKIE_NAME}=`))
    
    if (!authCookie) {
      return null
    }
    
    const cookieValue = authCookie.split('=')[1]
    const decoded = decodeURIComponent(cookieValue)
    const data: AuthCookie = JSON.parse(decoded)
    
    // Check if cookie is expired
    if (data.expiresAt && data.expiresAt < Date.now()) {
      clearAuthCookie()
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error reading auth cookie:', error)
    return null
  }
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/**
 * Check if user is authenticated via cookie
 */
export function isAuthenticatedViaCookie(): boolean {
  const cookie = getAuthCookie()
  return cookie !== null && cookie.expiresAt > Date.now()
}
