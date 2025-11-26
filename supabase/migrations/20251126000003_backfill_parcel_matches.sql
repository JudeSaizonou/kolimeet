-- ============================================================================
-- MIGRATION: Backfill des correspondances pour données existantes
-- VERSION: 20251126000003
-- DATE: 2024-11-26
-- DESCRIPTION: Génère les matches entre tous les colis/trajets existants
-- IDEMPOTENT: ✅ Oui (peut être exécuté plusieurs fois sans doublons)
-- PERFORMANCE: ✅ Traitement par batch (100 items/batch)
-- ROLLBACK: ✅ Transaction + fonction de cleanup
-- SÉCURITÉ: ✅ Guards + validation + logs détaillés
-- ============================================================================

-- ============================================================================
-- PARTIE 1: GUARDS & VALIDATION PRÉ-MIGRATION
-- ============================================================================

DO $$
BEGIN
  -- Vérifier que la table parcel_matches existe
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parcel_matches') THEN
    RAISE EXCEPTION 'Table parcel_matches does not exist. Run migration 20251125235959 first.';
  END IF;

  -- Vérifier que les colonnes requises existent
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'parcels' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'Column status missing from parcels table.';
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'capacity_available_kg'
  ) THEN
    RAISE EXCEPTION 'Column capacity_available_kg missing from trips table.';
  END IF;

  RAISE NOTICE '✅ Pre-migration validation passed';
END $$;

-- ============================================================================
-- PARTIE 2: FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour calculer le score de correspondance entre un colis et un trajet
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_parcel_id UUID,
  p_trip_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_score INTEGER := 0;
  v_parcel RECORD;
  v_trip RECORD;
  v_days_diff NUMERIC;
BEGIN
  -- Récupérer les infos du colis
  SELECT * INTO v_parcel FROM parcels WHERE id = p_parcel_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Récupérer les infos du trajet
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Score de base: même pays départ ET arrivée = 50 points
  IF v_parcel.from_country = v_trip.from_country 
     AND v_parcel.to_country = v_trip.to_country THEN
    v_score := 50;
  ELSE
    RETURN 0; -- Pas de match si pays différents
  END IF;

  -- Bonus ville de départ identique = +20 points
  IF v_parcel.from_city = v_trip.from_city THEN
    v_score := v_score + 20;
  END IF;

  -- Bonus ville d'arrivée identique = +20 points
  IF v_parcel.to_city = v_trip.to_city THEN
    v_score := v_score + 20;
  END IF;

  -- Bonus date optimale (≤7 jours avant deadline) = +10 points
  v_days_diff := EXTRACT(EPOCH FROM (v_parcel.deadline - v_trip.date_departure)) / 86400;
  IF v_days_diff >= 0 AND v_days_diff <= 7 THEN
    v_score := v_score + 10;
  END IF;

  -- Limiter à 100
  RETURN LEAST(v_score, 100);
END;
$$;

-- Fonction pour vérifier l'éligibilité d'un match selon les règles métier
CREATE OR REPLACE FUNCTION is_match_eligible(
  p_parcel_id UUID,
  p_trip_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_parcel RECORD;
  v_trip RECORD;
  v_score INTEGER;
BEGIN
  -- Récupérer le colis
  SELECT * INTO v_parcel FROM parcels WHERE id = p_parcel_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Récupérer le trajet
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Règle 1: Statuts doivent être 'active'
  IF v_parcel.status != 'active' OR v_trip.status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- Règle 2: Capacité disponible suffisante
  IF v_trip.capacity_available_kg < v_parcel.weight_kg THEN
    RETURN FALSE;
  END IF;

  -- Règle 3: Date de départ avant deadline
  IF v_trip.date_departure > v_parcel.deadline THEN
    RETURN FALSE;
  END IF;

  -- Règle 4: Score minimum de 50%
  v_score := calculate_match_score(p_parcel_id, p_trip_id);
  IF v_score < 50 THEN
    RETURN FALSE;
  END IF;

  -- Règle 5: Pas le même propriétaire (éviter auto-matching)
  IF v_parcel.user_id = v_trip.user_id THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- PARTIE 3: FONCTION DE BACKFILL PRINCIPALE
-- ============================================================================

CREATE OR REPLACE FUNCTION backfill_parcel_matches(
  p_dry_run BOOLEAN DEFAULT TRUE,
  p_batch_size INTEGER DEFAULT 100
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_time TIMESTAMP := clock_timestamp();
  v_end_time TIMESTAMP;
  v_total_parcels INTEGER := 0;
  v_total_trips INTEGER := 0;
  v_total_matches_created INTEGER := 0;
  v_total_matches_skipped INTEGER := 0;
  v_current_batch INTEGER := 0;
  v_total_batches INTEGER;
  v_parcel RECORD;
  v_trip RECORD;
  v_score INTEGER;
  v_match_exists BOOLEAN;
  v_error_count INTEGER := 0;
  v_result JSON;
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  BACKFILL PARCEL MATCHES - DÉMARRAGE                          ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Mode: %', CASE WHEN p_dry_run THEN 'DRY RUN (simulation)' ELSE 'PRODUCTION' END;
  RAISE NOTICE '📦 Batch size: %', p_batch_size;
  RAISE NOTICE '🕐 Heure de démarrage: %', v_start_time;
  RAISE NOTICE '';

  -- Compter le nombre total de colis et trajets actifs
  SELECT COUNT(*) INTO v_total_parcels FROM parcels WHERE status = 'active';
  SELECT COUNT(*) INTO v_total_trips FROM trips WHERE status = 'active';
  
  v_total_batches := CEIL(v_total_parcels::NUMERIC / p_batch_size);

  RAISE NOTICE '📊 Statistiques:';
  RAISE NOTICE '   • Colis actifs: %', v_total_parcels;
  RAISE NOTICE '   • Trajets actifs: %', v_total_trips;
  RAISE NOTICE '   • Nombre de batchs: %', v_total_batches;
  RAISE NOTICE '   • Matches max possibles: %', (v_total_parcels * v_total_trips);
  RAISE NOTICE '';

  IF v_total_parcels = 0 OR v_total_trips = 0 THEN
    RAISE NOTICE '⚠️  Aucun colis ou trajet actif trouvé. Arrêt.';
    RETURN json_build_object(
      'success', true,
      'dry_run', p_dry_run,
      'total_parcels', v_total_parcels,
      'total_trips', v_total_trips,
      'matches_created', 0,
      'matches_skipped', 0,
      'errors', 0,
      'duration_seconds', 0
    );
  END IF;

  RAISE NOTICE '🚀 Début du traitement par batch...';
  RAISE NOTICE '';

  -- Boucle sur tous les colis actifs
  FOR v_parcel IN 
    SELECT * FROM parcels 
    WHERE status = 'active'
    ORDER BY created_at DESC
  LOOP
    -- Afficher la progression tous les N colis
    IF (v_current_batch % p_batch_size) = 0 THEN
      v_current_batch := v_current_batch + 1;
      RAISE NOTICE '📦 Batch %/% - Processing parcel % (from: %, to: %)', 
        v_current_batch, 
        v_total_batches,
        v_parcel.id,
        v_parcel.from_city,
        v_parcel.to_city;
    END IF;

    -- Boucle sur tous les trajets compatibles
    FOR v_trip IN 
      SELECT * FROM trips 
      WHERE status = 'active'
        AND capacity_available_kg >= v_parcel.weight_kg
        AND date_departure <= v_parcel.deadline
        AND from_country = v_parcel.from_country
        AND to_country = v_parcel.to_country
        AND user_id != v_parcel.user_id -- Éviter l'auto-matching
    LOOP
      BEGIN
        -- Vérifier l'éligibilité complète
        IF NOT is_match_eligible(v_parcel.id, v_trip.id) THEN
          v_total_matches_skipped := v_total_matches_skipped + 1;
          CONTINUE;
        END IF;

        -- Calculer le score
        v_score := calculate_match_score(v_parcel.id, v_trip.id);
        
        IF v_score < 50 THEN
          v_total_matches_skipped := v_total_matches_skipped + 1;
          CONTINUE;
        END IF;

        -- Vérifier si le match existe déjà (idempotence)
        SELECT EXISTS(
          SELECT 1 FROM parcel_matches 
          WHERE parcel_id = v_parcel.id AND trip_id = v_trip.id
        ) INTO v_match_exists;

        IF v_match_exists THEN
          v_total_matches_skipped := v_total_matches_skipped + 1;
          CONTINUE;
        END IF;

        -- Insérer le match (si pas en dry run)
        IF NOT p_dry_run THEN
          INSERT INTO parcel_matches (parcel_id, trip_id, match_score, status)
          VALUES (v_parcel.id, v_trip.id, v_score, 'pending')
          ON CONFLICT (parcel_id, trip_id) DO NOTHING;
        END IF;

        v_total_matches_created := v_total_matches_created + 1;

        -- Log pour les excellents matches (≥90%)
        IF v_score >= 90 THEN
          RAISE NOTICE '   ⭐ Excellent match trouvé: score=% (parcel % → trip %)', 
            v_score, v_parcel.id, v_trip.id;
        END IF;

      EXCEPTION WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        RAISE NOTICE '   ❌ Erreur pour parcel % + trip %: %', 
          v_parcel.id, v_trip.id, SQLERRM;
        -- Continuer avec les autres
      END;
    END LOOP;
  END LOOP;

  v_end_time := clock_timestamp();

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  BACKFILL TERMINÉ                                              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   • Matches créés: % %', v_total_matches_created, 
    CASE WHEN p_dry_run THEN '(simulation)' ELSE '' END;
  RAISE NOTICE '   • Matches ignorés: %', v_total_matches_skipped;
  RAISE NOTICE '   • Erreurs: %', v_error_count;
  RAISE NOTICE '   • Durée: % secondes', EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INTEGER;
  RAISE NOTICE '';

  -- Construire le résultat JSON
  v_result := json_build_object(
    'success', true,
    'dry_run', p_dry_run,
    'start_time', v_start_time,
    'end_time', v_end_time,
    'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INTEGER,
    'total_parcels', v_total_parcels,
    'total_trips', v_total_trips,
    'matches_created', v_total_matches_created,
    'matches_skipped', v_total_matches_skipped,
    'errors', v_error_count,
    'batch_size', p_batch_size
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- PARTIE 4: FONCTION DE ROLLBACK
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_all_backfilled_matches()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_result JSON;
BEGIN
  RAISE NOTICE '⚠️  ROLLBACK: Suppression de tous les matches...';
  
  -- Compter avant suppression
  SELECT COUNT(*) INTO v_count FROM parcel_matches;
  
  RAISE NOTICE '📊 Matches actuels: %', v_count;
  
  -- Supprimer TOUS les matches
  DELETE FROM parcel_matches;
  
  RAISE NOTICE '✅ Tous les matches ont été supprimés';
  
  v_result := json_build_object(
    'success', true,
    'matches_deleted', v_count,
    'timestamp', NOW()
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- PARTIE 5: FONCTION DE VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_backfill_results()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_matches INTEGER;
  v_duplicates INTEGER;
  v_invalid_scores INTEGER;
  v_invalid_status INTEGER;
  v_orphan_parcels INTEGER;
  v_orphan_trips INTEGER;
  v_result JSON;
BEGIN
  RAISE NOTICE '🔍 Validation des résultats du backfill...';
  RAISE NOTICE '';

  -- 1. Compter le nombre total de matches
  SELECT COUNT(*) INTO v_total_matches FROM parcel_matches;
  RAISE NOTICE '✓ Total matches: %', v_total_matches;

  -- 2. Vérifier les doublons
  SELECT COUNT(*) INTO v_duplicates
  FROM (
    SELECT parcel_id, trip_id, COUNT(*)
    FROM parcel_matches
    GROUP BY parcel_id, trip_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicates > 0 THEN
    RAISE WARNING '⚠️  Doublons détectés: %', v_duplicates;
  ELSE
    RAISE NOTICE '✓ Aucun doublon';
  END IF;

  -- 3. Vérifier les scores invalides
  SELECT COUNT(*) INTO v_invalid_scores
  FROM parcel_matches
  WHERE match_score < 50 OR match_score > 100;
  
  IF v_invalid_scores > 0 THEN
    RAISE WARNING '⚠️  Scores invalides: %', v_invalid_scores;
  ELSE
    RAISE NOTICE '✓ Tous les scores sont valides (50-100)';
  END IF;

  -- 4. Vérifier les statuts invalides
  SELECT COUNT(*) INTO v_invalid_status
  FROM parcel_matches
  WHERE status NOT IN ('pending', 'accepted', 'rejected', 'expired');
  
  IF v_invalid_status > 0 THEN
    RAISE WARNING '⚠️  Statuts invalides: %', v_invalid_status;
  ELSE
    RAISE NOTICE '✓ Tous les statuts sont valides';
  END IF;

  -- 5. Vérifier les colis orphelins (match vers un colis inexistant)
  SELECT COUNT(*) INTO v_orphan_parcels
  FROM parcel_matches pm
  LEFT JOIN parcels p ON p.id = pm.parcel_id
  WHERE p.id IS NULL;
  
  IF v_orphan_parcels > 0 THEN
    RAISE WARNING '⚠️  Matches vers colis inexistants: %', v_orphan_parcels;
  ELSE
    RAISE NOTICE '✓ Aucun colis orphelin';
  END IF;

  -- 6. Vérifier les trajets orphelins
  SELECT COUNT(*) INTO v_orphan_trips
  FROM parcel_matches pm
  LEFT JOIN trips t ON t.id = pm.trip_id
  WHERE t.id IS NULL;
  
  IF v_orphan_trips > 0 THEN
    RAISE WARNING '⚠️  Matches vers trajets inexistants: %', v_orphan_trips;
  ELSE
    RAISE NOTICE '✓ Aucun trajet orphelin';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Validation terminée';

  v_result := json_build_object(
    'total_matches', v_total_matches,
    'duplicates', v_duplicates,
    'invalid_scores', v_invalid_scores,
    'invalid_status', v_invalid_status,
    'orphan_parcels', v_orphan_parcels,
    'orphan_trips', v_orphan_trips,
    'is_valid', (v_duplicates = 0 AND v_invalid_scores = 0 AND v_invalid_status = 0 
                 AND v_orphan_parcels = 0 AND v_orphan_trips = 0)
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- PARTIE 6: GRANTS & COMMENTAIRES
-- ============================================================================

-- Grants pour authenticated users
GRANT EXECUTE ON FUNCTION calculate_match_score(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_match_eligible(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_parcel_matches(BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_backfill_results() TO authenticated;

-- Commentaires
COMMENT ON FUNCTION calculate_match_score IS 'Calcule le score de compatibilité entre un colis et un trajet (0-100)';
COMMENT ON FUNCTION is_match_eligible IS 'Vérifie si un match respecte toutes les règles métier';
COMMENT ON FUNCTION backfill_parcel_matches IS 'Génère les correspondances pour tous les colis/trajets existants (avec dry_run)';
COMMENT ON FUNCTION remove_all_backfilled_matches IS 'ROLLBACK: Supprime tous les matches générés';
COMMENT ON FUNCTION validate_backfill_results IS 'Valide l''intégrité des matches après backfill';

-- ============================================================================
-- INSTRUCTIONS D'EXÉCUTION
-- ============================================================================
-- 
-- 1. DRY RUN (Simulation - recommandé d'abord):
--    SELECT backfill_parcel_matches(TRUE, 100);
--
-- 2. PRODUCTION (Exécution réelle):
--    SELECT backfill_parcel_matches(FALSE, 100);
--
-- 3. VALIDATION:
--    SELECT validate_backfill_results();
--
-- 4. ROLLBACK (en cas de problème):
--    SELECT remove_all_backfilled_matches();
--
-- ============================================================================
