-- Migration: Add rate limiting infrastructure
-- Track API requests for rate limiting

CREATE TABLE IF NOT EXISTS public.api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  status_code INTEGER
);

-- Index for fast rate limit checks
CREATE INDEX IF NOT EXISTS idx_api_requests_rate_limit 
ON public.api_requests(ip_address, created_at DESC);

-- Index for user-based rate limiting
CREATE INDEX IF NOT EXISTS idx_api_requests_user 
ON public.api_requests(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Index for endpoint analytics
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint 
ON public.api_requests(endpoint, created_at DESC);

-- Cleanup old requests automatically (keep only last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_api_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_requests 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address INET,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 60,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*) INTO request_count
  FROM public.api_requests
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Return true if under limit
  RETURN request_count < p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log API request function
CREATE OR REPLACE FUNCTION log_api_request(
  p_ip_address INET,
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status_code INTEGER DEFAULT 200
)
RETURNS UUID AS $$
DECLARE
  request_id UUID;
BEGIN
  INSERT INTO public.api_requests (ip_address, endpoint, user_id, user_agent, status_code)
  VALUES (p_ip_address, p_endpoint, p_user_id, p_user_agent, p_status_code)
  RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON public.api_requests TO authenticated;
GRANT SELECT, INSERT ON public.api_requests TO anon;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION log_api_request TO authenticated;
GRANT EXECUTE ON FUNCTION log_api_request TO anon;

-- RLS policies
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own requests
CREATE POLICY "Users can view own requests" ON public.api_requests
FOR SELECT USING (
  auth.uid() = user_id OR
  has_role(auth.uid(), 'admin')
);

-- System can insert all requests
CREATE POLICY "System can insert requests" ON public.api_requests
FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.api_requests IS 'Tracks API requests for rate limiting and analytics';
COMMENT ON FUNCTION check_rate_limit IS 'Check if IP has exceeded rate limit for endpoint';
COMMENT ON FUNCTION log_api_request IS 'Log an API request for rate limiting';
