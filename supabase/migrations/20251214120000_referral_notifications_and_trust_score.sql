-- Migration: Notifications push pour le parrainage + Score de confiance amélioré
-- 1. Trigger pour notifier quand on reçoit une demande de parrainage
-- 2. Trigger pour notifier quand un parrainage est accepté/refusé
-- 3. Fonction améliorée pour calculer le score de confiance

-- ============================================================
-- PARTIE 1: NOTIFICATIONS PUSH POUR LE PARRAINAGE
-- ============================================================

-- Fonction pour notifier lors d'une nouvelle demande de parrainage
CREATE OR REPLACE FUNCTION notify_referral_request()
RETURNS TRIGGER AS $$
DECLARE
  referrer_name TEXT;
  payload JSONB;
BEGIN
  -- Récupérer le nom du parrain
  SELECT COALESCE(full_name, 'Quelqu''un') INTO referrer_name
  FROM profiles
  WHERE user_id = NEW.referrer_id;

  -- Construire le payload pour OneSignal
  payload := jsonb_build_object(
    'recipientUserId', NEW.referred_id::text,
    'title', '🤝 Demande de parrainage',
    'message', referrer_name || ' souhaite vous parrainer',
    'url', '/profile',
    'data', jsonb_build_object(
      'type', 'referral_request',
      'referral_id', NEW.id::text,
      'referrer_id', NEW.referrer_id::text
    )
  );

  -- Appeler l'Edge Function via supabase_functions.http_request
  PERFORM supabase_functions.http_request(
    'https://odzxqpaovgxcwqilildp.supabase.co/functions/v1/send-onesignal-notification',
    'POST',
    '{"Content-Type":"application/json"}',
    payload::text,
    '5000'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send referral request notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier lors d'une réponse au parrainage
CREATE OR REPLACE FUNCTION notify_referral_response()
RETURNS TRIGGER AS $$
DECLARE
  referred_name TEXT;
  payload JSONB;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Ne notifier que si le statut change de 'pending' à 'accepted' ou 'declined'
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
    -- Récupérer le nom du filleul
    SELECT COALESCE(full_name, 'Quelqu''un') INTO referred_name
    FROM profiles
    WHERE user_id = NEW.referred_id;

    IF NEW.status = 'accepted' THEN
      notification_title := '🎉 Parrainage accepté !';
      notification_message := referred_name || ' a accepté votre parrainage';
    ELSE
      notification_title := 'Parrainage refusé';
      notification_message := referred_name || ' a décliné votre demande de parrainage';
    END IF;

    -- Construire le payload pour OneSignal
    payload := jsonb_build_object(
      'recipientUserId', NEW.referrer_id::text,
      'title', notification_title,
      'message', notification_message,
      'url', '/profile',
      'data', jsonb_build_object(
        'type', 'referral_response',
        'referral_id', NEW.id::text,
        'status', NEW.status
      )
    );

    -- Appeler l'Edge Function
    PERFORM supabase_functions.http_request(
      'https://odzxqpaovgxcwqilildp.supabase.co/functions/v1/send-onesignal-notification',
      'POST',
      '{"Content-Type":"application/json"}',
      payload::text,
      '5000'
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send referral response notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS on_referral_request ON referrals;
DROP TRIGGER IF EXISTS on_referral_response ON referrals;

-- Créer le trigger pour les nouvelles demandes
CREATE TRIGGER on_referral_request
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION notify_referral_request();

-- Créer le trigger pour les réponses (avant la mise à jour des compteurs)
CREATE TRIGGER on_referral_response
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION notify_referral_response();

-- ============================================================
-- PARTIE 2: ALGORITHME DE SCORE DE CONFIANCE AMÉLIORÉ
-- ============================================================

-- Fonction pour recalculer le score de confiance d'un utilisateur
-- Prend en compte : parrainages, avis, activité, vérifications
CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 30;           -- Score de base pour tout le monde
  phone_bonus INTEGER := 0;           -- +15 si téléphone vérifié
  referrer_bonus INTEGER := 0;        -- +10 par parrain (max 50)
  referral_bonus INTEGER := 0;        -- +3 par filleul (max 15)
  review_bonus INTEGER := 0;          -- Basé sur les avis reçus
  activity_bonus INTEGER := 0;        -- Basé sur l'activité
  seniority_bonus INTEGER := 0;       -- Basé sur l'ancienneté
  
  profile_record RECORD;
  avg_rating NUMERIC;
  review_count INTEGER;
  total_trips INTEGER;
  total_parcels INTEGER;
  account_age_days INTEGER;
  referrer_count INTEGER;
  referral_count INTEGER;
  
  final_score INTEGER;
BEGIN
  -- Récupérer le profil
  SELECT * INTO profile_record
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN base_score;
  END IF;
  
  -- Bonus téléphone vérifié (+15)
  IF profile_record.phone_verified = true THEN
    phone_bonus := 15;
  END IF;
  
  -- Bonus parrains (+10 par parrain, max 50)
  SELECT COUNT(*) INTO referrer_count
  FROM referrals
  WHERE referred_id = p_user_id AND status = 'accepted';
  
  referrer_bonus := LEAST(referrer_count * 10, 50);
  
  -- Bonus filleuls (+3 par filleul, max 15)
  SELECT COUNT(*) INTO referral_count
  FROM referrals
  WHERE referrer_id = p_user_id AND status = 'accepted';
  
  referral_bonus := LEAST(referral_count * 3, 15);
  
  -- Bonus avis (+5 par avis positif, -5 par avis négatif, max ±20)
  SELECT COALESCE(AVG(rating), 0), COUNT(*) INTO avg_rating, review_count
  FROM reviews
  WHERE target_user_id = p_user_id;
  
  IF review_count > 0 THEN
    -- Score basé sur la moyenne des avis (1-5 étoiles)
    -- 5 étoiles = +20, 4 étoiles = +10, 3 étoiles = 0, 2 étoiles = -10, 1 étoile = -20
    review_bonus := ROUND((avg_rating - 3) * 10);
    review_bonus := GREATEST(-20, LEAST(review_bonus, 20));
  END IF;
  
  -- Bonus activité (+2 par trajet/colis publié, max 10)
  SELECT COUNT(*) INTO total_trips
  FROM trips
  WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO total_parcels
  FROM parcels
  WHERE user_id = p_user_id;
  
  activity_bonus := LEAST((total_trips + total_parcels) * 2, 10);
  
  -- Bonus ancienneté (+1 par mois d'ancienneté, max 10)
  SELECT EXTRACT(DAY FROM NOW() - profile_record.created_at)::INTEGER INTO account_age_days;
  seniority_bonus := LEAST(account_age_days / 30, 10);
  
  -- Calcul du score final (0-100)
  final_score := base_score + phone_bonus + referrer_bonus + referral_bonus 
                 + review_bonus + activity_bonus + seniority_bonus;
  
  -- Assurer que le score reste entre 0 et 100
  final_score := GREATEST(0, LEAST(final_score, 100));
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le score de confiance d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_trust_score(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  new_score INTEGER;
BEGIN
  new_score := calculate_trust_score(p_user_id);
  
  UPDATE profiles
  SET trust_score = new_score
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Améliorer la fonction existante pour utiliser le nouveau calcul
CREATE OR REPLACE FUNCTION update_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Incrémenter le compteur du parrain (nombre de filleuls)
    UPDATE profiles 
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE user_id = NEW.referrer_id;
    
    -- Incrémenter le compteur du filleul (nombre de parrains)
    UPDATE profiles 
    SET referred_by_count = COALESCE(referred_by_count, 0) + 1
    WHERE user_id = NEW.referred_id;
    
    -- Recalculer les scores de confiance
    PERFORM update_user_trust_score(NEW.referrer_id);
    PERFORM update_user_trust_score(NEW.referred_id);
    
    NEW.accepted_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour recalculer le score après un nouvel avis
CREATE OR REPLACE FUNCTION update_trust_score_after_review()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_user_trust_score(NEW.target_user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_update_trust ON reviews;
CREATE TRIGGER on_review_update_trust
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_score_after_review();

-- Trigger pour recalculer le score quand le téléphone est vérifié
CREATE OR REPLACE FUNCTION update_trust_score_after_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer si le statut de vérification du téléphone change
  IF OLD.phone_verified IS DISTINCT FROM NEW.phone_verified THEN
    PERFORM update_user_trust_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_update_trust ON profiles;
CREATE TRIGGER on_profile_update_trust
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_score_after_profile_change();

-- ============================================================
-- PARTIE 3: RECALCULER TOUS LES SCORES EXISTANTS
-- ============================================================

-- Fonction pour recalculer tous les scores de confiance (à exécuter une fois)
CREATE OR REPLACE FUNCTION recalculate_all_trust_scores()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  count_updated INTEGER := 0;
BEGIN
  FOR user_record IN SELECT user_id FROM profiles LOOP
    PERFORM update_user_trust_score(user_record.user_id);
    count_updated := count_updated + 1;
  END LOOP;
  
  RETURN count_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter le recalcul initial
SELECT recalculate_all_trust_scores();

-- ============================================================
-- COMMENTAIRES
-- ============================================================
COMMENT ON FUNCTION calculate_trust_score IS 'Calcule le score de confiance (0-100) basé sur: parrainages, avis, activité, vérifications, ancienneté';
COMMENT ON FUNCTION update_user_trust_score IS 'Met à jour le score de confiance d''un utilisateur';
COMMENT ON FUNCTION notify_referral_request IS 'Envoie une notification push lors d''une demande de parrainage';
COMMENT ON FUNCTION notify_referral_response IS 'Envoie une notification push lors d''une réponse à un parrainage';
