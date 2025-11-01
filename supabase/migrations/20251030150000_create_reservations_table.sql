-- Create reservations table for booking capacity with payment
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 0),
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg >= 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- En attente de confirmation du voyageur
    'confirmed',    -- Confirmé par le voyageur, en attente de paiement
    'paid',         -- Payé, réservation active
    'cancelled',    -- Annulé
    'completed'     -- Terminé (voyage effectué)
  )),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending',      -- En attente de paiement
    'processing',   -- Paiement en cours
    'paid',         -- Payé avec succès
    'failed',       -- Paiement échoué
    'refunded'      -- Remboursé
  )),
  stripe_payment_intent_id TEXT,
  message TEXT, -- Message de l'utilisateur au voyageur
  notes TEXT,   -- Notes du voyageur sur la réservation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_reservations_trip ON public.reservations(trip_id);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_payment ON public.reservations(payment_status);

-- RLS Policies
-- Users can view their own reservations (as customer)
CREATE POLICY "Users can view their reservations"
ON public.reservations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create reservations
CREATE POLICY "Users can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reservations
CREATE POLICY "Users can update their reservations"
ON public.reservations
FOR UPDATE
USING (auth.uid() = user_id);

-- Trip owners can view and update reservations for their trips
CREATE POLICY "Trip owners can view reservations"
ON public.reservations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.trips 
  WHERE trips.id = reservations.trip_id 
  AND trips.user_id = auth.uid()
));

CREATE POLICY "Trip owners can update reservations"
ON public.reservations
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.trips 
  WHERE trips.id = reservations.trip_id 
  AND trips.user_id = auth.uid()
));

-- Admins can do everything
CREATE POLICY "Admins can manage all reservations"
ON public.reservations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update trip capacity when reservation is confirmed/cancelled
CREATE OR REPLACE FUNCTION public.handle_reservation_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la réservation passe à 'paid', décrémenter la capacité disponible
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE public.trips 
    SET capacity_available_kg = capacity_available_kg - NEW.weight_kg
    WHERE id = NEW.trip_id;
  END IF;
  
  -- Si une réservation payée est annulée, remettre la capacité
  IF OLD.status = 'paid' AND NEW.status IN ('cancelled', 'refunded') THEN
    UPDATE public.trips 
    SET capacity_available_kg = capacity_available_kg + NEW.weight_kg
    WHERE id = NEW.trip_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour gérer automatiquement la capacité
CREATE TRIGGER trigger_reservation_capacity
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_capacity();

COMMENT ON TABLE public.reservations IS 'User reservations for trip capacity with payment tracking';