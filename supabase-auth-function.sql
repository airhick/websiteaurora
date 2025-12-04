-- Create a function to authenticate against customers table
-- This function can be called with the anon key but checks credentials securely
CREATE OR REPLACE FUNCTION authenticate_customer(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id BIGINT,
  email TEXT,
  company TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer RECORD;
BEGIN
  -- Query customers table (trim email for comparison)
  SELECT c.id, c.email, c.company, c.created_at
  INTO v_customer
  FROM customers c
  WHERE TRIM(LOWER(c.email)) = TRIM(LOWER(p_email))
    AND c.password = p_password
  LIMIT 1;

  -- If customer found, return the data
  IF v_customer IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_customer.id,
      v_customer.email,
      v_customer.company,
      v_customer.created_at;
  ELSE
    -- Return empty result if not found
    RETURN;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return empty
    RAISE WARNING 'Error in authenticate_customer: %', SQLERRM;
    RETURN;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION authenticate_customer(TEXT, TEXT) TO anon, authenticated;

-- Test the function (optional - remove after testing)
-- SELECT * FROM authenticate_customer('1@glatt.ch', 'glatt');

