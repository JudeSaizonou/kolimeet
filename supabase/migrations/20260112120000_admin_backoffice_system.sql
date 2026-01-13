-- ============================================================================
-- KOLIMEET ADMIN BACK OFFICE SYSTEM
-- Created: 2026-01-12
-- Description: Complete admin system with users, logs, support tickets
-- ============================================================================

-- ============================================================================
-- TYPES & ENUMS
-- ============================================================================

-- Admin roles
CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator', 'support', 'analyst');

-- Support ticket statuses
CREATE TYPE support_status AS ENUM ('new', 'open', 'pending', 'resolved', 'closed');

-- Ticket priority
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Sender type for support messages
CREATE TYPE sender_type AS ENUM ('user', 'admin');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Add moderation columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  role admin_role NOT NULL DEFAULT 'support',
  permissions JSONB DEFAULT '{
    "users": [],
    "content": [],
    "flags": [],
    "analytics": [],
    "settings": []
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Admin Activity Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(user_id),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status support_status DEFAULT 'new',
  priority ticket_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES admin_users(user_id),
  category VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. Support Messages (Thread)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_type sender_type NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(user_id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Canned Responses
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Admin users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role) WHERE is_active = true;

-- Admin activity logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_activity_logs(target_type, target_id);

-- Support tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(ticket_number);

-- Support messages
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender_id);

-- Canned responses
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON canned_responses(category);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

CREATE TRIGGER set_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- Update ticket updated_at on new message
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_on_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_ticket_timestamp();

-- Update admin last_login
CREATE OR REPLACE FUNCTION update_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE admin_users
  SET last_login = NOW()
  WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION has_admin_role(required_role admin_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
    AND (
      role = 'super_admin' OR -- super_admin has all permissions
      role = required_role
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Users Policies
CREATE POLICY "Super admins can view all admin users" ON admin_users
  FOR SELECT
  USING (has_admin_role('super_admin'));

CREATE POLICY "Admins can view their own profile" ON admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only super admins can manage admin users" ON admin_users
  FOR ALL
  USING (has_admin_role('super_admin'));

-- Admin Activity Logs Policies
CREATE POLICY "Admins can view activity logs" ON admin_activity_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert activity logs" ON admin_activity_logs
  FOR INSERT
  WITH CHECK (true); -- Logs are inserted by system functions

-- Support Tickets Policies
CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets" ON support_tickets
  FOR UPDATE
  USING (is_admin());

-- Support Messages Policies
CREATE POLICY "Admins can view all messages" ON support_messages
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can view messages from their tickets" ON support_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_messages.ticket_id
      AND user_id = auth.uid()
    )
    AND NOT is_internal -- Users can't see internal notes
  );

CREATE POLICY "Admins can insert messages" ON support_messages
  FOR INSERT
  WITH CHECK (is_admin() AND sender_type = 'admin');

CREATE POLICY "Users can insert messages to their tickets" ON support_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id
      AND user_id = auth.uid()
    )
    AND sender_type = 'user'
    AND NOT is_internal
  );

-- Platform Settings Policies
CREATE POLICY "Admins can view settings" ON platform_settings
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Only super admins can modify settings" ON platform_settings
  FOR ALL
  USING (has_admin_role('super_admin'));

-- Canned Responses Policies
CREATE POLICY "Admins can view canned responses" ON canned_responses
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can create canned responses" ON canned_responses
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update their canned responses" ON canned_responses
  FOR UPDATE
  USING (created_by = auth.uid() OR has_admin_role('super_admin'));

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Dashboard Stats View
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  -- Users
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE updated_at > NOW() - INTERVAL '30 days') as active_users_30d,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) as new_users_today,
  (SELECT COUNT(*) FROM profiles WHERE is_verified = true) as verified_users,
  (SELECT COUNT(*) FROM profiles WHERE is_banned = true) as banned_users,
  
  -- Activity
  (SELECT COUNT(*) FROM trips) as total_trips,
  (SELECT COUNT(*) FROM trips WHERE status = 'open') as active_trips,
  (SELECT COUNT(*) FROM parcels) as total_parcels,
  (SELECT COUNT(*) FROM parcels WHERE status = 'open') as active_parcels,
  
  -- Reservations
  (SELECT COUNT(*) FROM reservation_requests) as total_reservations,
  (SELECT COUNT(*) FROM reservation_requests WHERE status = 'accepted') as completed_reservations,
  
  -- Moderation
  (SELECT COUNT(*) FROM flags WHERE status = 'pending') as pending_flags,
  (SELECT COUNT(*) FROM feedbacks) as total_feedbacks,
  
  -- Performance
  (SELECT ROUND(AVG(trust_score)) FROM profiles) as avg_trust_score,
  (SELECT ROUND((COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) FROM reservation_requests) as success_rate;

-- Daily Activity View
CREATE OR REPLACE VIEW admin_daily_activity AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE type = 'trip') as trips_created,
  COUNT(*) FILTER (WHERE type = 'parcel') as parcels_created,
  COUNT(DISTINCT user_id) as active_users
FROM (
  SELECT created_at, 'trip' as type, user_id FROM trips
  UNION ALL
  SELECT created_at, 'parcel' as type, user_id FROM parcels
) combined
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 90;

-- Top Routes View
CREATE OR REPLACE VIEW admin_top_routes AS
SELECT 
  from_country,
  from_city,
  to_country,
  to_city,
  COUNT(*) as trip_count,
  ROUND(AVG(price_expect), 2) as avg_price
FROM trips
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY from_country, from_city, to_country, to_city
ORDER BY trip_count DESC
LIMIT 20;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('general', '{"platform_name": "Kolimeet", "support_email": "support@kolimeet.com", "maintenance_mode": false}'::jsonb, 'General platform settings'),
  ('limits', '{"max_trips_per_user_per_day": 5, "max_parcels_per_user_per_day": 5, "min_trust_score_to_publish": 20, "max_file_upload_size_mb": 10}'::jsonb, 'Platform limits and quotas'),
  ('moderation', '{"auto_flag_keywords": ["drugs", "weapons", "illegal"], "auto_approve_verified_users": true, "min_trust_score_threshold": 30}'::jsonb, 'Moderation settings'),
  ('trust_score_config', '{"new_user_score": 50, "verified_id_bonus": 10, "verified_phone_bonus": 5, "completed_trip_bonus": 2, "good_review_bonus": 1, "flag_penalty": -10}'::jsonb, 'Trust score configuration')
ON CONFLICT (key) DO NOTHING;

-- Insert default canned responses
INSERT INTO canned_responses (title, content, category) VALUES
  ('Vérification compte', 'Bonjour,\n\nPour vérifier votre compte, veuillez suivre ces étapes:\n1. Accédez à votre profil\n2. Cliquez sur "Vérifier mon identité"\n3. Suivez les instructions\n\nCordialement,\nL''équipe Kolimeet', 'account'),
  ('Trust Score', 'Bonjour,\n\nLe Trust Score est calculé en fonction de:\n- Vérifications (identité, téléphone)\n- Avis reçus\n- Transactions complétées\n- Ancienneté du compte\n\nVous pouvez l''améliorer en complétant votre profil et en effectuant des transactions réussies.\n\nCordialement,\nL''équipe Kolimeet', 'account'),
  ('Signalement traité', 'Bonjour,\n\nNous avons bien reçu votre signalement et l''avons traité. Les mesures appropriées ont été prises.\n\nMerci de contribuer à la sécurité de notre communauté.\n\nCordialement,\nL''équipe Kolimeet', 'moderation');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE admin_users IS 'Admin users with roles and permissions';
COMMENT ON TABLE admin_activity_logs IS 'Audit trail of all admin actions';
COMMENT ON TABLE support_tickets IS 'Support tickets from users';
COMMENT ON TABLE support_messages IS 'Messages within support tickets';
COMMENT ON TABLE platform_settings IS 'Platform-wide configuration settings';
COMMENT ON TABLE canned_responses IS 'Pre-written responses for support';

COMMENT ON TYPE admin_role IS 'Admin user roles: super_admin > moderator > support > analyst';
COMMENT ON TYPE support_status IS 'Support ticket status workflow';
COMMENT ON TYPE ticket_priority IS 'Support ticket priority levels';
