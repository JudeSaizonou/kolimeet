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
END $$;

-- 2. Créer le trigger qui empêche les demandes actives multiples
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_reservations()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('pending', 'counter_offered') THEN
    IF EXISTS (
      SELECT 1 FROM reservation_requests
      WHERE requester_id = NEW.requester_id
        AND trip_id = NEW.trip_id
        AND status IN ('pending', 'counter_offered')
    ) THEN
      RAISE EXCEPTION 'Une demande active existe déjà pour ce trajet.';
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
SELECT 'Migration appliquée avec succès ! Les contre-offres sont maintenant possibles.' as status;