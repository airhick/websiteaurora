-- Update missing durations for existing call_logs
-- This calculates duration from started_at and artifact.endedAt or artifact.ended_at
-- Run this after syncing calls to backfill duration for older records

UPDATE call_logs
SET duration = CASE
  -- If artifact has endedAt, calculate from started_at and endedAt
  WHEN artifact->>'endedAt' IS NOT NULL AND started_at IS NOT NULL THEN
    EXTRACT(EPOCH FROM (CAST(artifact->>'endedAt' AS TIMESTAMPTZ) - started_at))::INTEGER
  -- If artifact has ended_at, calculate from started_at and ended_at
  WHEN artifact->>'ended_at' IS NOT NULL AND started_at IS NOT NULL THEN
    EXTRACT(EPOCH FROM (CAST(artifact->>'ended_at' AS TIMESTAMPTZ) - started_at))::INTEGER
  ELSE NULL
END
WHERE duration IS NULL
  AND started_at IS NOT NULL
  AND artifact IS NOT NULL
  AND (
    artifact->>'endedAt' IS NOT NULL OR
    artifact->>'ended_at' IS NOT NULL
  );

-- Verify the update
SELECT 
  customer_id,
  COUNT(*) as total_calls,
  COUNT(duration) as calls_with_duration,
  ROUND(SUM(duration)::NUMERIC / 60.0, 2) as total_minutes
FROM call_logs
GROUP BY customer_id;

