-- Migration: Auto-suppression des annonces expirées
-- Cette migration ajoute un système pour supprimer automatiquement les annonces
-- dont la date est passée (date_departure pour trips, deadline pour parcels)

-- Option 1: Soft delete - on passe le statut à 'expired' au lieu de supprimer
-- Option 2: Hard delete - suppression complète

-- On choisit l'option 1 (soft delete) pour garder l'historique

-- Ajouter le statut 'expired' aux contraintes
ALTER TABLE public.trips 
  DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE public.trips 
  ADD CONSTRAINT trips_status_check 
  CHECK (status IN ('open', 'closed', 'expired'));

ALTER TABLE public.parcels 
  DROP CONSTRAINT IF EXISTS parcels_status_check;
ALTER TABLE public.parcels 
  ADD CONSTRAINT parcels_status_check 
  CHECK (status IN ('open', 'closed', 'expired'));

-- Fonction pour marquer les annonces expirées
CREATE OR REPLACE FUNCTION public.expire_old_listings()
RETURNS void AS $$
DECLARE
  expired_trips_count INTEGER;
  expired_parcels_count INTEGER;
BEGIN
  -- Marquer les voyages dont la date de départ est passée comme expirés
  UPDATE public.trips
  SET status = 'expired'
  WHERE status = 'open'
    AND date_departure < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_trips_count = ROW_COUNT;
  
  -- Marquer les colis dont la deadline est passée comme expirés
  UPDATE public.parcels
  SET status = 'expired'
  WHERE status = 'open'
    AND deadline < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_parcels_count = ROW_COUNT;
  
  -- Log le nombre d'annonces expirées
  IF expired_trips_count > 0 OR expired_parcels_count > 0 THEN
    RAISE NOTICE 'Expired listings: % trips, % parcels', expired_trips_count, expired_parcels_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction appelable via HTTP (pour Supabase Cron ou Edge Function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_listings()
RETURNS json AS $$
DECLARE
  expired_trips_count INTEGER;
  expired_parcels_count INTEGER;
BEGIN
  -- Marquer les voyages expirés
  UPDATE public.trips
  SET status = 'expired'
  WHERE status = 'open'
    AND date_departure < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_trips_count = ROW_COUNT;
  
  -- Marquer les colis expirés
  UPDATE public.parcels
  SET status = 'expired'
  WHERE status = 'open'
    AND deadline < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_parcels_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'expired_trips', expired_trips_count,
    'expired_parcels', expired_parcels_count,
    'executed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les RLS policies pour exclure les annonces expirées de la vue publique
DROP POLICY IF EXISTS "Anyone can view open trips" ON public.trips;
CREATE POLICY "Anyone can view open trips"
  ON public.trips FOR SELECT
  USING (
    (status = 'open' AND date_departure >= CURRENT_DATE) 
    OR auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Anyone can view open parcels" ON public.parcels;
CREATE POLICY "Anyone can view open parcels"
  ON public.parcels FOR SELECT
  USING (
    (status = 'open' AND deadline >= CURRENT_DATE) 
    OR auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Exécuter immédiatement pour nettoyer les annonces déjà expirées
SELECT public.expire_old_listings();

-- Note: Pour une exécution automatique quotidienne, il faut soit:
-- 1. Activer pg_cron dans Supabase (payant)
-- 2. Utiliser une Edge Function avec un cron externe (Vercel Cron, GitHub Actions)
-- 3. Appeler cleanup_expired_listings() via un cron externe

COMMENT ON FUNCTION public.expire_old_listings() IS 'Marque les annonces dont la date est passée comme expirées';
COMMENT ON FUNCTION public.cleanup_expired_listings() IS 'Version HTTP-callable de expire_old_listings, retourne JSON';
