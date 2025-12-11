-- Migration: Système de parrainage pour renforcer la confiance
-- Inspiré de "Gens de Confiance"

-- Table des parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  relationship TEXT, -- 'friend', 'family', 'colleague', 'neighbor', 'other'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Un utilisateur ne peut parrainer une même personne qu'une fois
  UNIQUE(referrer_id, referred_id),
  
  -- On ne peut pas se parrainer soi-même
  CHECK (referrer_id != referred_id)
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Mise à jour du profil pour le score de confiance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Voir ses propres parrainages (envoyés ou reçus)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Créer un parrainage
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- Mettre à jour un parrainage reçu (accepter/refuser)
CREATE POLICY "Users can update received referrals"
  ON referrals FOR UPDATE
  TO authenticated
  USING (auth.uid() = referred_id)
  WITH CHECK (auth.uid() = referred_id);

-- Supprimer son propre parrainage envoyé (si pending)
CREATE POLICY "Users can delete own pending referrals"
  ON referrals FOR DELETE
  TO authenticated
  USING (auth.uid() = referrer_id AND status = 'pending');

-- Fonction pour mettre à jour les compteurs de parrainage
CREATE OR REPLACE FUNCTION update_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Incrémenter le compteur du parrain (nombre de filleuls)
    UPDATE profiles 
    SET referral_count = COALESCE(referral_count, 0) + 1,
        trust_score = LEAST(100, COALESCE(trust_score, 50) + 5)
    WHERE user_id = NEW.referrer_id;
    
    -- Incrémenter le compteur du filleul (nombre de parrains)
    UPDATE profiles 
    SET referred_by_count = COALESCE(referred_by_count, 0) + 1,
        trust_score = LEAST(100, COALESCE(trust_score, 50) + 10)
    WHERE user_id = NEW.referred_id;
    
    NEW.accepted_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_referral_status_change ON referrals;

-- Créer le trigger
CREATE TRIGGER on_referral_status_change
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_counts();

-- Policy pour permettre de voir les parrains des autres utilisateurs (pour afficher les badges)
CREATE POLICY "Anyone can view accepted referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (status = 'accepted');

-- Comments
COMMENT ON TABLE referrals IS 'Système de parrainage pour renforcer la confiance entre utilisateurs';
COMMENT ON COLUMN referrals.relationship IS 'Type de relation: friend, family, colleague, neighbor, other';
COMMENT ON COLUMN profiles.referral_count IS 'Nombre de personnes parrainées (filleuls)';
COMMENT ON COLUMN profiles.referred_by_count IS 'Nombre de parrains';
COMMENT ON COLUMN profiles.trust_score IS 'Score de confiance de 0 à 100';
COMMENT ON COLUMN profiles.is_verified IS 'Indique si l identité a été vérifiée';
