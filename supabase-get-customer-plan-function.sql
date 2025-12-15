-- Create a function to get customer plan by customer ID
-- This function can be called with the anon key but bypasses RLS
CREATE OR REPLACE FUNCTION get_customer_plan(
  p_customer_id BIGINT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
BEGIN
  -- Query customers table (bypasses RLS due to SECURITY DEFINER)
  SELECT plan
  INTO v_plan
  FROM customers
  WHERE id = p_customer_id
  LIMIT 1;

  -- Return the plan string (or NULL if not found)
  RETURN v_plan;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return NULL
    RAISE WARNING 'Error in get_customer_plan: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_customer_plan(BIGINT) TO anon, authenticated;

-- Test the function (optional - remove after testing)
-- SELECT get_customer_plan(3);

