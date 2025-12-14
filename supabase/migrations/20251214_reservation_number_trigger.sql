-- Génère un numéro de réservation lisible et unique (ex: RZV-XXXXXX) à chaque insertion
CREATE OR REPLACE FUNCTION public.gen_reservation_number()
RETURNS trigger AS $$
DECLARE
  shortid TEXT;
BEGIN
  -- Générer un shortid à partir de l'UUID (6 derniers caractères en base36)
  shortid := upper('RZV-' || right(to_hex((('x' || replace(new.id::text, '-', ''))::bit(128))::bigint), 6));
  -- S'assurer de l'unicité (en cas de collision, ajouter un random)
  WHILE EXISTS (SELECT 1 FROM reservation_requests WHERE reservation_number = shortid) LOOP
    shortid := upper('RZV-' || substr(md5(random()::text), 1, 6));
  END LOOP;
  NEW.reservation_number := shortid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reservation_number ON reservation_requests;
CREATE TRIGGER set_reservation_number
BEFORE INSERT ON reservation_requests
FOR EACH ROW
EXECUTE FUNCTION public.gen_reservation_number();
