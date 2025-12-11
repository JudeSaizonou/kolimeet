-- Migration: Add reports system and user verification
-- Date: 2025-11-30

-- Table des signalements
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('trip', 'parcel', 'user', 'message')),
  target_id UUID NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- Vérification d'identité des utilisateurs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;

-- Compteur de signalements reçus (pour modération automatique)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reports_received INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Historique des transactions pour traçabilité
CREATE TABLE IF NOT EXISTS transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_user ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created ON transaction_logs(created_at);

-- RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Utilisateurs peuvent créer des signalements
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Utilisateurs peuvent voir leurs propres signalements
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Logs accessibles uniquement par le propriétaire
DROP POLICY IF EXISTS "Users can view own logs" ON transaction_logs;
CREATE POLICY "Users can view own logs"
  ON transaction_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour incrémenter le compteur de signalements
CREATE OR REPLACE FUNCTION increment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_user_id IS NOT NULL THEN
    UPDATE profiles 
    SET reports_received = COALESCE(reports_received, 0) + 1
    WHERE user_id = NEW.target_user_id;
    
    -- Suspension automatique après 5 signalements
    UPDATE profiles 
    SET is_suspended = true,
        suspended_until = NOW() + INTERVAL '7 days',
        suspension_reason = 'Suspension automatique: trop de signalements reçus'
    WHERE user_id = NEW.target_user_id 
    AND COALESCE(reports_received, 0) >= 5
    AND (is_suspended = false OR is_suspended IS NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS on_report_created ON reports;

-- Créer le trigger
CREATE TRIGGER on_report_created
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_report_count();

-- Comments
COMMENT ON TABLE reports IS 'User reports for suspicious activity';
COMMENT ON TABLE transaction_logs IS 'Audit log for traceability';
COMMENT ON COLUMN profiles.trust_score IS 'User trust score (0-100) based on activity and reviews';
COMMENT ON COLUMN profiles.is_verified IS 'Whether user has verified their identity';
