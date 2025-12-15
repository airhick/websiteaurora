import { useState, useEffect } from 'react'
import { getCustomerId } from '@/lib/vapi-api-key'
import { supabase } from '@/lib/supabase'

export type PlanType = 'basic' | 'pro' | 'entreprise' | null

export function useCustomerPlan() {
  const [plan, setPlan] = useState<PlanType>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Delay plan fetch to not block initial page load
    const timeout = setTimeout(() => {
      const fetchPlan = async () => {
        const customerId = getCustomerId()
        
        if (!customerId) {
          setLoading(false)
          return
        }

        try {
          // Use RPC function to bypass RLS (similar to get_customer_agents)
          const { data, error } = await supabase
            .rpc('get_customer_plan', {
              p_customer_id: customerId
            })

          if (error) {
            // If function doesn't exist, provide helpful error message
            if (error.code === '42883' || 
                error.message?.includes('function') || 
                error.message?.includes('does not exist') ||
                error.message?.includes('get_customer_plan')) {
              console.error('Function not found. Please run supabase-get-customer-plan-function.sql in Supabase SQL Editor.')
              // Fallback to direct query (may fail due to RLS)
              const { data: fallbackData, error: fallbackError } = await supabase
            .from('customers')
            .select('plan')
            .eq('id', customerId)
            .maybeSingle()

              if (!fallbackError && fallbackData?.plan) {
                const normalizedPlan = fallbackData.plan.toLowerCase().trim()
                if (['basic', 'pro', 'entreprise'].includes(normalizedPlan)) {
                  setPlan(normalizedPlan as PlanType)
                }
              }
            } else {
            console.error('Error fetching customer plan:', error)
            }
            setLoading(false)
            return
          }

          // RPC function returns the plan string directly (or NULL)
          if (data && typeof data === 'string') {
            // Normalize plan name to lowercase
            const normalizedPlan = data.toLowerCase().trim()
            if (['basic', 'pro', 'entreprise'].includes(normalizedPlan)) {
              setPlan(normalizedPlan as PlanType)
            }
          }
        } catch (error) {
          console.error('Error fetching customer plan:', error)
        } finally {
          setLoading(false)
        }
      }

      fetchPlan()
    }, 500) // Delay by 500ms to let stats load first

    return () => clearTimeout(timeout)
  }, [])

  return { plan, loading }
}

