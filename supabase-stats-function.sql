-- Create a PostgreSQL function to calculate stats from call_logs
-- This is much faster than fetching all rows and calculating on the client

CREATE OR REPLACE FUNCTION get_customer_call_stats(customer_id_param BIGINT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalCalls', COUNT(*),
    'live', COUNT(*) FILTER (WHERE status IN ('in-progress', 'ringing', 'queued')),
    'transferred', COUNT(*) FILTER (WHERE ended_reason LIKE '%forward%' OR ended_reason LIKE '%transfer%' OR ended_reason = 'customer-transferred-call'),
    -- Calculate total minutes: sum all non-null durations and convert seconds to minutes
    -- Only count durations that are > 0 to avoid invalid data
    'totalMinutes', COALESCE(ROUND(SUM(CASE WHEN duration IS NOT NULL AND duration > 0 THEN duration ELSE 0 END)::NUMERIC / 60.0, 2), 0)
  ) INTO result
  FROM call_logs
  WHERE call_logs.customer_id = customer_id_param;
  
  RETURN COALESCE(result, json_build_object(
    'totalCalls', 0,
    'live', 0,
    'transferred', 0,
    'totalMinutes', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_customer_call_stats(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_call_stats(BIGINT) TO anon;

