-- ============================================================================
-- ROLLBACK DU BACKFILL
-- Scripts de nettoyage d'urgence en cas de problème
-- ⚠️ ATTENTION: Ces scripts suppriment des données. Utiliser avec précaution.
-- ============================================================================

-- ============================================================================
-- OPTION 1: ROLLBACK COMPLET (Supprimer TOUS les matches)
-- ============================================================================

-- ÉTAPE 1: Vérifier le nombre de matches avant suppression
SELECT 
  COUNT(*) as total_matches,
  MIN(created_at) as oldest_match,
  MAX(created_at) as newest_match
FROM parcel_matches;

-- ÉTAPE 2: Backup des données (optionnel mais recommandé)
-- CREATE TABLE parcel_matches_backup AS SELECT * FROM parcel_matches;

-- ÉTAPE 3: Suppression complète
-- ⚠️ Décommenter la ligne suivante pour exécuter
-- SELECT remove_all_backfilled_matches();

-- ÉTAPE 4: Vérifier la suppression
SELECT COUNT(*) as remaining_matches FROM parcel_matches;

-- ============================================================================
-- OPTION 2: ROLLBACK PARTIEL (Supprimer les matches récents uniquement)
-- ============================================================================

-- Supprimer les matches créés dans la dernière heure
-- ⚠️ Décommenter les lignes suivantes pour exécuter
-- DELETE FROM parcel_matches 
-- WHERE created_at > NOW() - INTERVAL '1 hour';

-- Supprimer les matches créés aujourd'hui
-- ⚠️ Décommenter les lignes suivantes pour exécuter
-- DELETE FROM parcel_matches 
-- WHERE created_at::DATE = CURRENT_DATE;

-- Supprimer les matches créés après une date spécifique
-- ⚠️ Remplacer 'YYYY-MM-DD HH:MM:SS' par la date souhaitée
-- DELETE FROM parcel_matches 
-- WHERE created_at > '2024-11-26 10:00:00';

-- ============================================================================
-- OPTION 3: ROLLBACK SÉLECTIF (Supprimer uniquement les matches invalides)
-- ============================================================================

-- Supprimer les matches avec score < 50%
-- ⚠️ Décommenter pour exécuter
-- DELETE FROM parcel_matches WHERE match_score < 50;

-- Supprimer les matches avec score > 100%
-- ⚠️ Décommenter pour exécuter
-- DELETE FROM parcel_matches WHERE match_score > 100;

-- Supprimer les doublons (garder le plus ancien)
-- ⚠️ Décommenter pour exécuter
-- DELETE FROM parcel_matches
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (parcel_id, trip_id) id
--   FROM parcel_matches
--   ORDER BY parcel_id, trip_id, created_at
-- );

-- Supprimer les matches orphelins (colis inexistant)
-- ⚠️ Décommenter pour exécuter
-- DELETE FROM parcel_matches pm
-- WHERE NOT EXISTS (
--   SELECT 1 FROM parcels p WHERE p.id = pm.parcel_id
-- );

-- Supprimer les matches orphelins (trajet inexistant)
-- ⚠️ Décommenter pour exécuter
-- DELETE FROM parcel_matches pm
-- WHERE NOT EXISTS (
--   SELECT 1 FROM trips t WHERE t.id = pm.trip_id
-- );

-- ============================================================================
-- OPTION 4: ROLLBACK PAR ROUTE
-- ============================================================================

-- Supprimer les matches pour une route spécifique
-- ⚠️ Remplacer les valeurs et décommenter pour exécuter
-- DELETE FROM parcel_matches pm
-- USING parcels p
-- WHERE pm.parcel_id = p.id
--   AND p.from_country = 'France'
--   AND p.to_country = 'Bénin';

-- ============================================================================
-- OPTION 5: ROLLBACK PAR UTILISATEUR
-- ============================================================================

-- Supprimer les matches d'un utilisateur spécifique (côté colis)
-- ⚠️ Remplacer USER_ID et décommenter pour exécuter
-- DELETE FROM parcel_matches pm
-- USING parcels p
-- WHERE pm.parcel_id = p.id
--   AND p.user_id = 'USER_ID';

-- Supprimer les matches d'un utilisateur spécifique (côté trajets)
-- ⚠️ Remplacer USER_ID et décommenter pour exécuter
-- DELETE FROM parcel_matches pm
-- USING trips t
-- WHERE pm.trip_id = t.id
--   AND t.user_id = 'USER_ID';

-- ============================================================================
-- RESTAURATION DEPUIS BACKUP
-- ============================================================================

-- Si vous avez créé un backup (voir OPTION 1, ÉTAPE 2):

-- ÉTAPE 1: Vider la table actuelle
-- TRUNCATE parcel_matches;

-- ÉTAPE 2: Restaurer depuis le backup
-- INSERT INTO parcel_matches SELECT * FROM parcel_matches_backup;

-- ÉTAPE 3: Supprimer le backup
-- DROP TABLE parcel_matches_backup;

-- ============================================================================
-- VÉRIFICATION POST-ROLLBACK
-- ============================================================================

-- Vérifier le nombre de matches restants
SELECT COUNT(*) as remaining_matches FROM parcel_matches;

-- Vérifier la distribution des scores
SELECT 
  CASE 
    WHEN match_score >= 90 THEN 'Excellent (90-100%)'
    WHEN match_score >= 70 THEN 'Bon (70-89%)'
    WHEN match_score >= 50 THEN 'Acceptable (50-69%)'
    ELSE 'Invalide (<50%)'
  END as score_range,
  COUNT(*) as count
FROM parcel_matches
GROUP BY score_range;

-- Vérifier les dates de création
SELECT 
  DATE(created_at) as date,
  COUNT(*) as matches_created
FROM parcel_matches
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- RÉINITIALISATION COMPLÈTE (Dernier recours)
-- ============================================================================

-- ⚠️ DANGER: Ceci supprime TOUTES les données de matches et réinitialise la séquence
-- ⚠️ Utiliser UNIQUEMENT en environnement de développement
-- ⚠️ Décommenter pour exécuter

-- TRUNCATE parcel_matches RESTART IDENTITY CASCADE;

-- Vérifier que la table est vide
-- SELECT COUNT(*) FROM parcel_matches;

-- ============================================================================
-- LOGS & AUDIT
-- ============================================================================

-- Créer une table d'audit pour tracker les rollbacks (optionnel)
CREATE TABLE IF NOT EXISTS parcel_matches_rollback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rollback_type TEXT NOT NULL,
  matches_deleted INTEGER NOT NULL,
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Enregistrer un rollback dans les logs
-- INSERT INTO parcel_matches_rollback_log (rollback_type, matches_deleted, executed_by, notes)
-- VALUES (
--   'FULL_ROLLBACK', 
--   [NOMBRE_DE_MATCHES_SUPPRIMÉS], 
--   auth.uid(), 
--   'Raison du rollback ici'
-- );

-- Consulter l'historique des rollbacks
SELECT * FROM parcel_matches_rollback_log ORDER BY executed_at DESC;

-- ============================================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================================
--
-- 1. Identifier le type de rollback nécessaire (complet, partiel, sélectif)
-- 2. Vérifier le nombre de matches avant suppression
-- 3. (Optionnel) Créer un backup
-- 4. Décommenter et exécuter les commandes appropriées
-- 5. Vérifier les résultats avec les requêtes de vérification
-- 6. (Optionnel) Enregistrer le rollback dans les logs
--
-- ⚠️ En cas de doute, contacter l'équipe technique avant d'exécuter
--
-- ============================================================================
