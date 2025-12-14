-- Migration: Configuration du cron job pour le nettoyage automatique des annonces expirées
-- Date: 2025-12-14

-- Activer l'extension pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer le job s'il existe déjà (pour éviter les doublons)
SELECT cron.unschedule('cleanup-expired-listings')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-listings'
);

-- Créer le cron job pour exécuter le nettoyage tous les jours à 2h du matin (UTC)
SELECT cron.schedule(
    'cleanup-expired-listings',           -- Nom du job
    '0 2 * * *',                          -- Cron expression: tous les jours à 2h00 UTC
    $$SELECT cleanup_expired_listings()$$ -- Commande SQL à exécuter
);

-- Ajouter un commentaire pour documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - utilisé pour nettoyer les annonces expirées quotidiennement';
