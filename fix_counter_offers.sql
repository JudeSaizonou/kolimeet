-- Script à exécuter dans Supabase Studio > SQL Editor
-- pour corriger le problème de contre-offre

-- 1. Supprimer la contrainte unique existante si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'reservation_requests' AND indexname = 'reservation_requests_requester_id_trip_id_key'
  ) THEN
    ALTER TABLE reservation_requests DROP CONSTRAINT IF EXISTS reservation_requests_requester_id_trip_id_key;
  END IF;
  
  -- Supprimer aussi l'index unique partiel qui empêche les contre-offres
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'reservation_requests' AND indexname = 'unique_active_request_per_user_trip'
  ) THEN
    DROP INDEX unique_active_request_per_user_trip;
  END IF;
END $$;

-- 2. Créer le trigger qui empêche les demandes actives multiples
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_reservations()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('pending', 'counter_offered') THEN
    -- Si c'est une contre-offre (parent_request_id existe), permettre même s'il y a déjà une demande active
    -- car c'est une réponse à une offre spécifique dans le cadre d'une négociation
    IF NEW.parent_request_id IS NULL THEN
      -- C'est une nouvelle demande, vérifier qu'il n'y en a pas déjà une active
      IF EXISTS (
        SELECT 1 FROM reservation_requests
        WHERE requester_id = NEW.requester_id
          AND trip_id = NEW.trip_id
          AND status IN ('pending', 'counter_offered')
          AND parent_request_id IS NULL
      ) THEN
        RAISE EXCEPTION 'Une demande active existe déjà pour ce trajet.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Supprimer et recréer le trigger
DROP TRIGGER IF EXISTS prevent_multiple_active_reservations ON reservation_requests;
CREATE TRIGGER prevent_multiple_active_reservations
BEFORE INSERT ON reservation_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_multiple_active_reservations();

-- Message de confirmation
SELECT 'Migration appliquée avec succès ! Les contraintes uniques ont été supprimées et les contre-offres en chaîne sont maintenant possibles.' as status;