-- ============================================================================
-- VALIDATION POST-BACKFILL
-- Requêtes SQL pour vérifier l'intégrité des données après le backfill
-- ============================================================================

-- ============================================================================
-- 1. STATISTIQUES GÉNÉRALES
-- ============================================================================

-- Nombre total de matches créés
SELECT 
  COUNT(*) as total_matches,
  COUNT(DISTINCT parcel_id) as unique_parcels,
  COUNT(DISTINCT trip_id) as unique_trips,
  AVG(match_score)::INTEGER as avg_score,
  MIN(match_score) as min_score,
  MAX(match_score) as max_score
FROM parcel_matches;

-- Distribution des scores
SELECT 
  CASE 
    WHEN match_score >= 90 THEN '⭐ Excellent (90-100%)'
    WHEN match_score >= 70 THEN '🔵 Bon (70-89%)'
    WHEN match_score >= 50 THEN '🟡 Acceptable (50-69%)'
    ELSE '⚠️ Invalide (<50%)'
  END as score_range,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM parcel_matches), 2) as percentage
FROM parcel_matches
GROUP BY score_range
ORDER BY MIN(match_score) DESC;

-- ============================================================================
-- 2. VÉRIFICATION DES DOUBLONS
-- ============================================================================

-- Vérifier les doublons (même parcel_id + trip_id)
SELECT 
  parcel_id,
  trip_id,
  COUNT(*) as occurrences
FROM parcel_matches
GROUP BY parcel_id, trip_id
HAVING COUNT(*) > 1;

-- Si des doublons sont trouvés, les supprimer (garder le premier):
-- DELETE FROM parcel_matches
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (parcel_id, trip_id) id
--   FROM parcel_matches
--   ORDER BY parcel_id, trip_id, created_at
-- );

-- ============================================================================
-- 3. VÉRIFICATION DES SCORES INVALIDES
-- ============================================================================

-- Matches avec score < 50% (ne devraient pas exister)
SELECT 
  pm.id,
  pm.parcel_id,
  pm.trip_id,
  pm.match_score,
  p.from_city || ' → ' || p.to_city as parcel_route,
  t.from_city || ' → ' || t.to_city as trip_route
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN trips t ON t.id = pm.trip_id
WHERE pm.match_score < 50;

-- Matches avec score > 100% (ne devraient pas exister)
SELECT 
  pm.id,
  pm.parcel_id,
  pm.trip_id,
  pm.match_score
FROM parcel_matches pm
WHERE pm.match_score > 100;

-- ============================================================================
-- 4. VÉRIFICATION DES RÉFÉRENCES ORPHELINES
-- ============================================================================

-- Matches pointant vers des colis inexistants
SELECT 
  pm.id,
  pm.parcel_id,
  'Parcel not found' as issue
FROM parcel_matches pm
LEFT JOIN parcels p ON p.id = pm.parcel_id
WHERE p.id IS NULL;

-- Matches pointant vers des trajets inexistants
SELECT 
  pm.id,
  pm.trip_id,
  'Trip not found' as issue
FROM parcel_matches pm
LEFT JOIN trips t ON t.id = pm.trip_id
WHERE t.id IS NULL;

-- ============================================================================
-- 5. VÉRIFICATION DES RÈGLES MÉTIER
-- ============================================================================

-- Matches avec capacité insuffisante (ne devraient pas exister)
SELECT 
  pm.id,
  pm.match_score,
  p.weight_kg as parcel_weight,
  t.capacity_available_kg as trip_capacity,
  p.from_city || ' → ' || p.to_city as route
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN trips t ON t.id = pm.trip_id
WHERE t.capacity_available_kg < p.weight_kg;

-- Matches avec date incompatible (départ après deadline)
SELECT 
  pm.id,
  pm.match_score,
  t.date_departure,
  p.deadline,
  EXTRACT(DAY FROM (t.date_departure - p.deadline)) as days_after_deadline
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN trips t ON t.id = pm.trip_id
WHERE t.date_departure > p.deadline;

-- Matches avec pays différents (ne devraient pas exister)
SELECT 
  pm.id,
  pm.match_score,
  p.from_country || ' → ' || p.to_country as parcel_countries,
  t.from_country || ' → ' || t.to_country as trip_countries
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN trips t ON t.id = pm.trip_id
WHERE p.from_country != t.from_country 
   OR p.to_country != t.to_country;

-- Auto-matches (même utilisateur possède colis ET trajet)
SELECT 
  pm.id,
  pm.match_score,
  p.user_id as parcel_owner,
  t.user_id as trip_owner,
  'Same owner' as issue
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN trips t ON t.id = pm.trip_id
WHERE p.user_id = t.user_id;

-- ============================================================================
-- 6. TOP MATCHES (INSPECTION MANUELLE)
-- ============================================================================

-- Top 10 meilleurs matches
SELECT 
  pm.match_score,
  pm.status,
  pm.created_at,
  p.from_city || ' → ' || p.to_city as parcel_route,
  t.from_city || ' → ' || t.to_city as trip_route,
  p.weight_kg || 'kg' as weight,
  t.capacity_available_kg || 'kg' as capacity,
  t.date_departure,
  p.deadline
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN trips t ON t.id = pm.trip_id
ORDER BY pm.match_score DESC, pm.created_at DESC
LIMIT 10;

-- ============================================================================
-- 7. MATCHES PAR UTILISATEUR
-- ============================================================================

-- Top 10 utilisateurs avec le plus de matches (côté colis)
SELECT 
  p.user_id,
  u.email,
  COUNT(*) as matches_count,
  AVG(pm.match_score)::INTEGER as avg_score
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
JOIN auth.users u ON u.id = p.user_id
GROUP BY p.user_id, u.email
ORDER BY matches_count DESC
LIMIT 10;

-- Top 10 utilisateurs avec le plus de matches (côté trajets)
SELECT 
  t.user_id,
  u.email,
  COUNT(*) as matches_count,
  AVG(pm.match_score)::INTEGER as avg_score
FROM parcel_matches pm
JOIN trips t ON t.id = pm.trip_id
JOIN auth.users u ON u.id = t.user_id
GROUP BY t.user_id, u.email
ORDER BY matches_count DESC
LIMIT 10;

-- ============================================================================
-- 8. ROUTES POPULAIRES
-- ============================================================================

-- Top 10 routes avec le plus de matches
SELECT 
  p.from_country || ' (' || p.from_city || ') → ' || 
  p.to_country || ' (' || p.to_city || ')' as route,
  COUNT(*) as matches_count,
  AVG(pm.match_score)::INTEGER as avg_score
FROM parcel_matches pm
JOIN parcels p ON p.id = pm.parcel_id
GROUP BY p.from_country, p.from_city, p.to_country, p.to_city
ORDER BY matches_count DESC
LIMIT 10;

-- ============================================================================
-- 9. VALIDATION AUTOMATIQUE (Utiliser la fonction)
-- ============================================================================

SELECT validate_backfill_results();

-- ============================================================================
-- 10. CLEANUP (Si nécessaire)
-- ============================================================================

-- Supprimer les matches invalides (à exécuter SEULEMENT si des anomalies sont détectées)
-- 
-- DELETE FROM parcel_matches WHERE match_score < 50;
-- DELETE FROM parcel_matches WHERE match_score > 100;
-- DELETE FROM parcel_matches pm WHERE NOT EXISTS (SELECT 1 FROM parcels p WHERE p.id = pm.parcel_id);
-- DELETE FROM parcel_matches pm WHERE NOT EXISTS (SELECT 1 FROM trips t WHERE t.id = pm.trip_id);

-- ============================================================================
-- RÉSUMÉ DE VALIDATION
-- ============================================================================

-- Créer un rapport complet de validation
SELECT 
  json_build_object(
    'total_matches', (SELECT COUNT(*) FROM parcel_matches),
    'unique_parcels', (SELECT COUNT(DISTINCT parcel_id) FROM parcel_matches),
    'unique_trips', (SELECT COUNT(DISTINCT trip_id) FROM parcel_matches),
    'avg_score', (SELECT AVG(match_score)::INTEGER FROM parcel_matches),
    'has_duplicates', (
      SELECT COUNT(*) > 0 
      FROM (
        SELECT parcel_id, trip_id, COUNT(*) 
        FROM parcel_matches 
        GROUP BY parcel_id, trip_id 
        HAVING COUNT(*) > 1
      ) dups
    ),
    'invalid_scores', (
      SELECT COUNT(*) 
      FROM parcel_matches 
      WHERE match_score < 50 OR match_score > 100
    ),
    'orphan_parcels', (
      SELECT COUNT(*) 
      FROM parcel_matches pm 
      LEFT JOIN parcels p ON p.id = pm.parcel_id 
      WHERE p.id IS NULL
    ),
    'orphan_trips', (
      SELECT COUNT(*) 
      FROM parcel_matches pm 
      LEFT JOIN trips t ON t.id = pm.trip_id 
      WHERE t.id IS NULL
    ),
    'validation_timestamp', NOW()
  ) as validation_report;
