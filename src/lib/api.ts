import { supabase } from './supabase'

/**
 * Crawl a website and extract markdown content
 */
export async function crawlWebsite(url: string): Promise<{ markdown: string }> {
  try {
    // For now, we'll simulate the crawling with a mock response
    // In production, this should call a backend service
    console.log('Crawling URL:', url)
    
    // Simulated response
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    return {
      markdown: `# Business Information from ${url}\n\nThis is placeholder content extracted from your website. In production, this would contain actual content from your website.`,
    }
  } catch (error) {
    console.error('Error crawling website:', error)
    throw new Error('Failed to crawl website')
  }
}

/**
 * Create or update a customer record
 */
export async function createCustomer(data: {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  title?: string
}): Promise<any> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    // Check if customer exists
    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', data.email)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new customers
      throw fetchError
    }

    if (existing) {
      // Update existing customer
      const { data: updated, error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          title: data.title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) throw updateError
      return updated
    } else {
      // Create new customer
      const defaultCompanyId = import.meta.env.VITE_SUPABASE_DEFAULT_COMPANY_ID

      const { data: created, error: insertError } = await supabase
        .from('customers')
        .insert({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          title: data.title,
          company_id: defaultCompanyId,
        })
        .select()
        .single()

      if (insertError) throw insertError
      return created
    }
  } catch (error) {
    console.error('Error creating/updating customer:', error)
    throw error
  }
}

