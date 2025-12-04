-- Aurora Dashboard Database Schema
-- This schema supports comprehensive call analytics and dashboard metrics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT,
  caller_name TEXT,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'transferred')),
  call_type TEXT CHECK (call_type IN ('appointment_booking', 'general_inquiry', 'support_request', 'sales_inquiry', 'complaint', 'other')),
  ai_handled BOOLEAN DEFAULT true,
  human_transferred BOOLEAN DEFAULT false,
  transfer_reason TEXT,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call interactions table (for detailed conversation tracking)
CREATE TABLE IF NOT EXISTS call_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('user_input', 'ai_response', 'system_action', 'transfer')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Call outcomes table (for tracking specific results)
CREATE TABLE IF NOT EXISTS call_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_session_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('appointment_scheduled', 'information_provided', 'issue_resolved', 'escalated', 'callback_requested', 'no_action')),
  outcome_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily metrics table (for caching and performance)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  completed_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  transferred_calls INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  avg_duration_seconds DECIMAL(10,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  peak_hour INTEGER DEFAULT 0,
  call_types JSONB DEFAULT '{}',
  satisfaction_avg DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Hourly metrics table (for detailed time-based analytics)
CREATE TABLE IF NOT EXISTS hourly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  call_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  avg_duration_seconds DECIMAL(10,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, hour)
);

-- Weekly metrics table (for weekly aggregations)
CREATE TABLE IF NOT EXISTS weekly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  completed_calls INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  avg_duration_seconds DECIMAL(10,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  call_types JSONB DEFAULT '{}',
  growth_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_call_sessions_user_id ON call_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created_at ON call_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_call_type ON call_sessions(call_type);
CREATE INDEX IF NOT EXISTS idx_call_interactions_session_id ON call_interactions(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_interactions_timestamp ON call_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_call_outcomes_session_id ON call_outcomes(call_session_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_user_date_hour ON hourly_metrics(user_id, date, hour);
CREATE INDEX IF NOT EXISTS idx_weekly_metrics_user_week ON weekly_metrics(user_id, week_start);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_sessions_updated_at BEFORE UPDATE ON call_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hourly_metrics_updated_at BEFORE UPDATE ON hourly_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_metrics_updated_at BEFORE UPDATE ON weekly_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate call duration
CREATE OR REPLACE FUNCTION calculate_call_duration(session_id UUID)
RETURNS INTEGER AS $$
DECLARE
    duration INTEGER;
BEGIN
    SELECT EXTRACT(EPOCH FROM (session_end - session_start))::INTEGER
    INTO duration
    FROM call_sessions
    WHERE id = session_id AND session_end IS NOT NULL;
    
    RETURN COALESCE(duration, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update call session duration
CREATE OR REPLACE FUNCTION update_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        NEW.duration_seconds = calculate_call_duration(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_call_duration_trigger
    BEFORE UPDATE ON call_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_call_duration();

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE, target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    total_calls_count INTEGER;
    completed_calls_count INTEGER;
    failed_calls_count INTEGER;
    transferred_calls_count INTEGER;
    total_duration INTEGER;
    avg_duration DECIMAL(10,2);
    success_rate DECIMAL(5,2);
    peak_hour_val INTEGER;
    call_types_data JSONB;
    satisfaction_avg_val DECIMAL(3,2);
BEGIN
    -- Calculate basic metrics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'failed'),
        COUNT(*) FILTER (WHERE status = 'transferred'),
        COALESCE(SUM(duration_seconds), 0),
        COALESCE(AVG(duration_seconds), 0),
        COALESCE(AVG(satisfaction_score), 0)
    INTO 
        total_calls_count,
        completed_calls_count,
        failed_calls_count,
        transferred_calls_count,
        total_duration,
        avg_duration,
        satisfaction_avg_val
    FROM call_sessions
    WHERE DATE(created_at) = target_date AND user_id = target_user_id;
    
    -- Calculate success rate
    IF total_calls_count > 0 THEN
        success_rate := (completed_calls_count::DECIMAL / total_calls_count::DECIMAL) * 100;
    ELSE
        success_rate := 0;
    END IF;
    
    -- Find peak hour
    SELECT hour INTO peak_hour_val
    FROM (
        SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as call_count
        FROM call_sessions
        WHERE DATE(created_at) = target_date AND user_id = target_user_id
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY call_count DESC
        LIMIT 1
    ) peak_data;
    
    -- Aggregate call types
    SELECT jsonb_object_agg(call_type, call_count)
    INTO call_types_data
    FROM (
        SELECT call_type, COUNT(*) as call_count
        FROM call_sessions
        WHERE DATE(created_at) = target_date AND user_id = target_user_id AND call_type IS NOT NULL
        GROUP BY call_type
    ) types_data;
    
    -- Insert or update daily metrics
    INSERT INTO daily_metrics (
        user_id, date, total_calls, completed_calls, failed_calls, 
        transferred_calls, total_duration_seconds, avg_duration_seconds,
        success_rate, peak_hour, call_types, satisfaction_avg
    ) VALUES (
        target_user_id, target_date, total_calls_count, completed_calls_count,
        failed_calls_count, transferred_calls_count, total_duration,
        avg_duration, success_rate, COALESCE(peak_hour_val, 0),
        COALESCE(call_types_data, '{}'), satisfaction_avg_val
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        completed_calls = EXCLUDED.completed_calls,
        failed_calls = EXCLUDED.failed_calls,
        transferred_calls = EXCLUDED.transferred_calls,
        total_duration_seconds = EXCLUDED.total_duration_seconds,
        avg_duration_seconds = EXCLUDED.avg_duration_seconds,
        success_rate = EXCLUDED.success_rate,
        peak_hour = EXCLUDED.peak_hour,
        call_types = EXCLUDED.call_types,
        satisfaction_avg = EXCLUDED.satisfaction_avg,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate hourly metrics
CREATE OR REPLACE FUNCTION aggregate_hourly_metrics(target_date DATE, target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    hour_record RECORD;
BEGIN
    FOR hour_record IN 
        SELECT 
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) as call_count,
            COALESCE(SUM(duration_seconds), 0) as total_duration,
            COALESCE(AVG(duration_seconds), 0) as avg_duration,
            CASE 
                WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)::DECIMAL) * 100
                ELSE 0 
            END as success_rate
        FROM call_sessions
        WHERE DATE(created_at) = target_date AND user_id = target_user_id
        GROUP BY EXTRACT(HOUR FROM created_at)
    LOOP
        INSERT INTO hourly_metrics (
            user_id, date, hour, call_count, total_duration_seconds,
            avg_duration_seconds, success_rate
        ) VALUES (
            target_user_id, target_date, hour_record.hour, hour_record.call_count,
            hour_record.total_duration, hour_record.avg_duration, hour_record.success_rate
        )
        ON CONFLICT (user_id, date, hour)
        DO UPDATE SET
            call_count = EXCLUDED.call_count,
            total_duration_seconds = EXCLUDED.total_duration_seconds,
            avg_duration_seconds = EXCLUDED.avg_duration_seconds,
            success_rate = EXCLUDED.success_rate,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate growth metrics
CREATE OR REPLACE FUNCTION calculate_growth_metrics(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_week_start DATE;
    previous_week_start DATE;
    current_week_metrics RECORD;
    previous_week_metrics RECORD;
    growth_data JSONB;
BEGIN
    current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    previous_week_start := current_week_start - INTERVAL '1 week';
    
    -- Get current week metrics
    SELECT 
        COALESCE(SUM(total_calls), 0) as total_calls,
        COALESCE(AVG(success_rate), 0) as success_rate,
        COALESCE(AVG(avg_duration_seconds), 0) as avg_duration
    INTO current_week_metrics
    FROM daily_metrics
    WHERE user_id = target_user_id 
    AND date >= current_week_start 
    AND date < current_week_start + INTERVAL '1 week';
    
    -- Get previous week metrics
    SELECT 
        COALESCE(SUM(total_calls), 0) as total_calls,
        COALESCE(AVG(success_rate), 0) as success_rate,
        COALESCE(AVG(avg_duration_seconds), 0) as avg_duration
    INTO previous_week_metrics
    FROM daily_metrics
    WHERE user_id = target_user_id 
    AND date >= previous_week_start 
    AND date < current_week_start;
    
    -- Calculate growth percentages
    growth_data := jsonb_build_object(
        'total_calls_growth', 
        CASE 
            WHEN previous_week_metrics.total_calls > 0 
            THEN ROUND(((current_week_metrics.total_calls - previous_week_metrics.total_calls)::DECIMAL / previous_week_metrics.total_calls::DECIMAL) * 100, 1)
            ELSE 0 
        END,
        'success_rate_growth',
        CASE 
            WHEN previous_week_metrics.success_rate > 0 
            THEN ROUND(((current_week_metrics.success_rate - previous_week_metrics.success_rate)::DECIMAL / previous_week_metrics.success_rate::DECIMAL) * 100, 1)
            ELSE 0 
        END,
        'avg_duration_growth',
        CASE 
            WHEN previous_week_metrics.avg_duration > 0 
            THEN ROUND(((current_week_metrics.avg_duration - previous_week_metrics.avg_duration)::DECIMAL / previous_week_metrics.avg_duration::DECIMAL) * 100, 1)
            ELSE 0 
        END
    );
    
    RETURN growth_data;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for call_sessions
CREATE POLICY "Users can view own call sessions" ON call_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own call sessions" ON call_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own call sessions" ON call_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for call_interactions
CREATE POLICY "Users can view own call interactions" ON call_interactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM call_sessions WHERE id = call_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own call interactions" ON call_interactions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM call_sessions WHERE id = call_session_id AND user_id = auth.uid())
);

-- RLS Policies for call_outcomes
CREATE POLICY "Users can view own call outcomes" ON call_outcomes FOR SELECT USING (
    EXISTS (SELECT 1 FROM call_sessions WHERE id = call_session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own call outcomes" ON call_outcomes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM call_sessions WHERE id = call_session_id AND user_id = auth.uid())
);

-- RLS Policies for metrics tables
CREATE POLICY "Users can view own daily metrics" ON daily_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own hourly metrics" ON hourly_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own weekly metrics" ON weekly_metrics FOR SELECT USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
