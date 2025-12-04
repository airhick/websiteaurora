/**
 * Custom Authentication for Customers Table
 * Authenticates against the customers table using Supabase RPC function
 */

import { supabase } from './supabase'

export interface Customer {
  id: number
  email: string | null
  company: string | null
  created_at: string
}

/**
 * Authenticate user against customers table using RPC function
 * This uses a database function that can be called with anon key
 */
export async function authenticateWithCustomersTable(email: string, password: string): Promise<{
  customer: Customer | null
  error: string | null
}> {
  try {
    console.log('Attempting to authenticate:', { email: email.trim(), passwordLength: password.length })
    
    // Call the RPC function to authenticate
    const { data, error } = await supabase
      .rpc('authenticate_customer', {
        p_email: email.trim(),
        p_password: password
      })

    console.log('RPC response:', { data, error })

    if (error) {
      console.error('RPC auth error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // If function doesn't exist, provide helpful error message
      if (error.code === '42883' || 
          error.message?.includes('function') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('authenticate_customer')) {
        return { 
          customer: null, 
          error: 'Authentication function not found. Please run the SQL in supabase-auth-function.sql in your Supabase SQL Editor. See SETUP_CUSTOMER_AUTH.md for instructions.' 
        }
      }
      
      return { customer: null, error: `Authentication error: ${error.message || 'Invalid email or password'}` }
    }

    if (!data || data.length === 0) {
      console.warn('No customer found with these credentials')
      return { customer: null, error: 'Invalid email or password' }
    }

    // Return the first (and only) result
    const customerData = data[0]
    console.log('Customer authenticated successfully:', customerData)
    return { 
      customer: {
        id: customerData.id,
        email: customerData.email,
        company: customerData.company,
        created_at: customerData.created_at
      }, 
      error: null 
    }
  } catch (error: any) {
    console.error('Custom auth error:', error)
    return { customer: null, error: error.message || 'Authentication failed' }
  }
}

/**
 * Fallback: Direct query (will only work if RLS allows it)
 */
async function authenticateDirectQuery(email: string, password: string): Promise<{
  customer: Customer | null
  error: string | null
}> {
  try {
    // Try direct query - this may fail due to RLS policies
    const { data, error } = await supabase
      .from('customers')
      .select('id, email, company, created_at, password')
      .eq('email', email.trim())
      .single()

    if (error) {
      console.error('Direct query error:', error)
      return { 
        customer: null, 
        error: 'Please create the authenticate_customer function in Supabase. See supabase-auth-function.sql' 
      }
    }

    if (!data) {
      return { customer: null, error: 'Invalid email or password' }
    }

    // Check password
    if (data.password !== password) {
      return { customer: null, error: 'Invalid email or password' }
    }

    return { 
      customer: {
        id: data.id,
        email: data.email,
        company: data.company,
        created_at: data.created_at
      }, 
      error: null 
    }
  } catch (error: any) {
    console.error('Direct query auth error:', error)
    return { customer: null, error: error.message || 'Authentication failed' }
  }
}

/**
 * Create a mock session for customer
 * Since we're authenticating against customers table, we create a session-like object
 */
export async function createAuthUserForCustomer(customer: Customer) {
  try {
    // Create a mock user object from customer data
    const mockUser = {
      id: customer.id.toString(),
      email: customer.email || '',
      user_metadata: {
        company: customer.company,
      },
    }

    // Store customer in localStorage as fallback
    localStorage.setItem('aurora_customer', JSON.stringify(customer))
    
    // Create a minimal session-like object
    const mockSession = {
      user: mockUser,
      access_token: 'customer-auth',
      refresh_token: '',
      expires_at: Date.now() + 3600000, // 1 hour
    }

    return { session: mockSession as any, error: null }
  } catch (error: any) {
    console.error('Create auth user error:', error)
    return { session: null, error: error.message || 'Failed to create session' }
  }
}

