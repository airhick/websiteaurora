-- =====================================================
-- Aurora Dashboard - Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANIES TABLE
-- Stores company/business information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    website_url TEXT,
    business_description TEXT,
    crawled_content TEXT,
    crawled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CUSTOMERS TABLE
-- Stores user/customer information linked to auth.users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    title VARCHAR(100),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    business_url TEXT,
    crawled_content TEXT,
    crawled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company"
    ON public.companies FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM public.customers 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own company"
    ON public.companies FOR UPDATE
    USING (
        id IN (
            SELECT company_id FROM public.customers 
            WHERE user_id = auth.uid()
        )
    );

-- Customers policies
CREATE POLICY "Users can view their own customer record"
    ON public.customers FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own customer record"
    ON public.customers FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own customer record"
    ON public.customers FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to create customer record on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customers (user_id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create customer record when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert a default company
INSERT INTO public.companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Aurora AI')
ON CONFLICT DO NOTHING;

