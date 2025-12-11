-- =====================================================
-- MIGRATION: Système de Réservation Simple (sans paiement)
-- Description: Permet aux utilisateurs de réserver des kilos sur un trajet
-- Date: 2025-12-11
-- =====================================================

-- Table des réservations simples
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- Détails de la réservation
  weight_kg DECIMAL(10, 2) NOT NULL CHECK (weight_kg > 0),
  price_per_kg DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) DEFAULT 0,
  
  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  
  -- Message de l'expéditeur
  message TEXT,
  
  -- Notes du voyageur
  traveler_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Contrainte: l'utilisateur ne peut pas réserver son propre trajet
  CONSTRAINT different_users_booking CHECK (user_id != traveler_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler_id ON public.bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- RLS Policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres réservations (en tant qu'expéditeur ou voyageur)
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = traveler_id);

-- Les utilisateurs peuvent créer des réservations
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs réservations (annuler)
CREATE POLICY "Users can update their bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = traveler_id);

-- Les utilisateurs peuvent supprimer leurs réservations
CREATE POLICY "Users can delete their bookings"
  ON public.bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Vue pour les réservations avec profils
CREATE OR REPLACE VIEW public.bookings_with_profiles AS
SELECT 
  b.*,
  t.from_city,
  t.from_country,
  t.to_city,
  t.to_country,
  t.date_departure,
  t.capacity_available_kg,
  sender.full_name AS sender_name,
  sender.avatar_url AS sender_avatar,
  sender.rating_avg AS sender_rating,
  traveler.full_name AS traveler_name,
  traveler.avatar_url AS traveler_avatar,
  traveler.rating_avg AS traveler_rating
FROM public.bookings b
JOIN public.trips t ON b.trip_id = t.id
JOIN public.profiles sender ON b.user_id = sender.user_id
JOIN public.profiles traveler ON b.traveler_id = traveler.user_id;

-- Fonction pour mettre à jour la capacité disponible après acceptation
CREATE OR REPLACE FUNCTION update_trip_capacity_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand une réservation est acceptée, réduire la capacité disponible
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    UPDATE public.trips
    SET capacity_available_kg = capacity_available_kg - NEW.weight_kg
    WHERE id = NEW.trip_id AND capacity_available_kg >= NEW.weight_kg;
    
    -- Vérifier si la mise à jour a réussi
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Capacité insuffisante pour cette réservation';
    END IF;
    
    NEW.accepted_at = now();
  END IF;
  
  -- Quand une réservation acceptée est annulée, restaurer la capacité
  IF NEW.status IN ('cancelled', 'declined') AND OLD.status = 'accepted' THEN
    UPDATE public.trips
    SET capacity_available_kg = capacity_available_kg + OLD.weight_kg
    WHERE id = NEW.trip_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trip_capacity ON public.bookings;
CREATE TRIGGER trigger_update_trip_capacity
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_capacity_on_booking();

-- Accorder les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT ON public.bookings_with_profiles TO authenticated;
