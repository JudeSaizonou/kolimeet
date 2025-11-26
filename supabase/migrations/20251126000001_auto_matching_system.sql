-- Migration pour système de correspondances automatiques
-- Génère automatiquement des suggestions quand un colis ou trajet est publié

-- Fonction pour générer les correspondances d'un colis avec les trajets existants
CREATE OR REPLACE FUNCTION generate_parcel_matches(p_parcel_id UUID)
RETURNS void AS $$
DECLARE
  v_parcel RECORD;
  v_trip RECORD;
  v_score INTEGER;
BEGIN
  -- Récupérer les informations du colis
  SELECT * INTO v_parcel FROM parcels WHERE id = p_parcel_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Trouver les trajets compatibles
  FOR v_trip IN 
    SELECT t.* FROM trips t
    WHERE t.status = 'open'
      AND t.from_country = v_parcel.from_country
      AND t.to_country = v_parcel.to_country
      AND t.capacity_available_kg >= v_parcel.weight_kg
      AND t.date_departure >= v_parcel.created_at::date
      AND t.date_departure <= v_parcel.deadline
      AND t.user_id != v_parcel.user_id -- Pas de correspondance avec soi-même
      AND NOT EXISTS (
        SELECT 1 FROM parcel_matches pm
        WHERE pm.parcel_id = p_parcel_id AND pm.trip_id = t.id
      )
  LOOP
    -- Calculer le score de correspondance
    v_score := 50; -- Score de base pour route compatible
    
    -- Bonus si les villes correspondent exactement
    IF LOWER(v_trip.from_city) = LOWER(v_parcel.from_city) THEN
      v_score := v_score + 20;
    END IF;
    
    IF LOWER(v_trip.to_city) = LOWER(v_parcel.to_city) THEN
      v_score := v_score + 20;
    END IF;
    
    -- Bonus si la date est proche de la deadline
    IF v_trip.date_departure = v_parcel.deadline THEN
      v_score := v_score + 10;
    END IF;

    -- Insérer la correspondance
    INSERT INTO parcel_matches (parcel_id, trip_id, match_score, status)
    VALUES (p_parcel_id, v_trip.id, v_score, 'pending')
    ON CONFLICT (parcel_id, trip_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer les correspondances d'un trajet avec les colis existants
CREATE OR REPLACE FUNCTION generate_trip_matches(p_trip_id UUID)
RETURNS void AS $$
DECLARE
  v_trip RECORD;
  v_parcel RECORD;
  v_score INTEGER;
BEGIN
  -- Récupérer les informations du trajet
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Trouver les colis compatibles
  FOR v_parcel IN 
    SELECT p.* FROM parcels p
    WHERE p.status = 'open'
      AND p.from_country = v_trip.from_country
      AND p.to_country = v_trip.to_country
      AND p.weight_kg <= v_trip.capacity_available_kg
      AND v_trip.date_departure >= p.created_at::date
      AND v_trip.date_departure <= p.deadline
      AND p.user_id != v_trip.user_id -- Pas de correspondance avec soi-même
      AND NOT EXISTS (
        SELECT 1 FROM parcel_matches pm
        WHERE pm.parcel_id = p.id AND pm.trip_id = p_trip_id
      )
  LOOP
    -- Calculer le score de correspondance
    v_score := 50; -- Score de base pour route compatible
    
    -- Bonus si les villes correspondent exactement
    IF LOWER(v_trip.from_city) = LOWER(v_parcel.from_city) THEN
      v_score := v_score + 20;
    END IF;
    
    IF LOWER(v_trip.to_city) = LOWER(v_parcel.to_city) THEN
      v_score := v_score + 20;
    END IF;
    
    -- Bonus si la date est proche de la deadline
    IF v_trip.date_departure = v_parcel.deadline THEN
      v_score := v_score + 10;
    END IF;

    -- Insérer la correspondance
    INSERT INTO parcel_matches (parcel_id, trip_id, match_score, status)
    VALUES (v_parcel.id, p_trip_id, v_score, 'pending')
    ON CONFLICT (parcel_id, trip_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour générer les correspondances quand un colis est créé
CREATE OR REPLACE FUNCTION trigger_generate_parcel_matches()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer les correspondances de manière asynchrone (pg_background si disponible)
  PERFORM generate_parcel_matches(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_parcel_matches ON parcels;
CREATE TRIGGER auto_generate_parcel_matches
  AFTER INSERT ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_parcel_matches();

-- Trigger pour générer les correspondances quand un trajet est créé
CREATE OR REPLACE FUNCTION trigger_generate_trip_matches()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer les correspondances de manière asynchrone
  PERFORM generate_trip_matches(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_trip_matches ON trips;
CREATE TRIGGER auto_generate_trip_matches
  AFTER INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_trip_matches();

-- Vue pour faciliter la récupération des correspondances avec détails
CREATE OR REPLACE VIEW parcel_matches_detailed AS
SELECT 
  pm.id,
  pm.parcel_id,
  pm.trip_id,
  pm.match_score,
  pm.status,
  pm.created_at,
  -- Infos du colis
  p.type as parcel_type,
  p.weight_kg,
  p.size,
  p.from_country as parcel_from_country,
  p.from_city as parcel_from_city,
  p.to_country as parcel_to_country,
  p.to_city as parcel_to_city,
  p.deadline,
  p.user_id as parcel_user_id,
  -- Infos du trajet
  t.from_country as trip_from_country,
  t.from_city as trip_from_city,
  t.to_country as trip_to_country,
  t.to_city as trip_to_city,
  t.date_departure,
  t.capacity_available_kg,
  t.price_expect,
  t.user_id as trip_user_id
FROM parcel_matches pm
JOIN parcels p ON pm.parcel_id = p.id
JOIN trips t ON pm.trip_id = t.id;

-- Accorder les permissions sur la vue
GRANT SELECT ON parcel_matches_detailed TO authenticated;

-- Fonction pour obtenir les meilleures correspondances d'un colis
CREATE OR REPLACE FUNCTION get_parcel_top_matches(p_parcel_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  match_id UUID,
  trip_id UUID,
  match_score INTEGER,
  trip_from_city TEXT,
  trip_to_city TEXT,
  date_departure DATE,
  capacity_available_kg DECIMAL,
  price_expect DECIMAL,
  traveler_name TEXT,
  traveler_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id as match_id,
    pm.trip_id,
    pm.match_score,
    t.from_city as trip_from_city,
    t.to_city as trip_to_city,
    t.date_departure,
    t.capacity_available_kg,
    t.price_expect,
    prof.full_name as traveler_name,
    prof.rating_avg as traveler_rating
  FROM parcel_matches pm
  JOIN trips t ON pm.trip_id = t.id
  JOIN profiles prof ON t.user_id = prof.user_id
  WHERE pm.parcel_id = p_parcel_id
    AND pm.status = 'pending'
    AND t.status = 'open'
  ORDER BY pm.match_score DESC, t.date_departure ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les meilleures correspondances d'un trajet
CREATE OR REPLACE FUNCTION get_trip_top_matches(p_trip_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  match_id UUID,
  parcel_id UUID,
  match_score INTEGER,
  parcel_type TEXT,
  weight_kg DECIMAL,
  parcel_from_city TEXT,
  parcel_to_city TEXT,
  deadline DATE,
  sender_name TEXT,
  sender_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id as match_id,
    pm.parcel_id,
    pm.match_score,
    p.type as parcel_type,
    p.weight_kg,
    p.from_city as parcel_from_city,
    p.to_city as parcel_to_city,
    p.deadline,
    prof.full_name as sender_name,
    prof.rating_avg as sender_rating
  FROM parcel_matches pm
  JOIN parcels p ON pm.parcel_id = p.id
  JOIN profiles prof ON p.user_id = prof.user_id
  WHERE pm.trip_id = p_trip_id
    AND pm.status = 'pending'
    AND p.status = 'open'
  ORDER BY pm.match_score DESC, p.deadline ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION generate_parcel_matches(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_trip_matches(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_parcel_top_matches(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trip_top_matches(UUID, INTEGER) TO authenticated;

-- Commentaires
COMMENT ON FUNCTION generate_parcel_matches IS 'Génère automatiquement les correspondances entre un colis et les trajets compatibles';
COMMENT ON FUNCTION generate_trip_matches IS 'Génère automatiquement les correspondances entre un trajet et les colis compatibles';
COMMENT ON FUNCTION get_parcel_top_matches IS 'Retourne les meilleures correspondances pour un colis donné';
COMMENT ON FUNCTION get_trip_top_matches IS 'Retourne les meilleures correspondances pour un trajet donné';
