-- Mise à jour du système de réservations pour escrow avec commission
-- Ajout de champs pour la gestion des fonds bloqués et commissions

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS escrow_status TEXT NOT NULL DEFAULT 'pending' CHECK (escrow_status IN (
  'pending',           -- Fonds pas encore captés
  'held',             -- Fonds bloqués en escrow
  'released_traveler', -- Fonds libérés au voyageur
  'released_customer', -- Fonds remboursés au client
  'partially_released' -- Paiement partiel (disputes)
));

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS platform_commission_rate NUMERIC DEFAULT 0.05 CHECK (platform_commission_rate >= 0 AND platform_commission_rate <= 1);
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS platform_commission_amount NUMERIC DEFAULT 0 CHECK (platform_commission_amount >= 0);
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS traveler_payout_amount NUMERIC DEFAULT 0 CHECK (traveler_payout_amount >= 0);
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN (
  'stripe_card',      -- Carte bancaire via Stripe
  'orange_money',     -- Orange Money
  'mtn_money',        -- MTN Mobile Money
  'wave',             -- Wave
  'moov_money',       -- Moov Money
  'bank_transfer'     -- Virement bancaire
));

-- Champs pour le suivi de livraison
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_confirmation_code TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payout_processed_at TIMESTAMPTZ;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payout_reference TEXT;

-- Table pour gérer les commissions de la plateforme
CREATE TABLE IF NOT EXISTS public.platform_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  commission_amount NUMERIC NOT NULL CHECK (commission_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS sur platform_earnings
ALTER TABLE public.platform_earnings ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les earnings
CREATE POLICY "Admins can view platform earnings"
ON public.platform_earnings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_reservations_escrow_status ON public.reservations(escrow_status);
CREATE INDEX IF NOT EXISTS idx_reservations_currency ON public.reservations(currency);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_earned_at ON public.platform_earnings(earned_at);

-- Fonction pour calculer automatiquement les montants lors de la création
CREATE OR REPLACE FUNCTION public.calculate_reservation_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer la commission (par défaut 5%)
  NEW.platform_commission_amount := NEW.total_amount * COALESCE(NEW.platform_commission_rate, 0.05);
  
  -- Calculer le montant qui ira au voyageur
  NEW.traveler_payout_amount := NEW.total_amount - NEW.platform_commission_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement les montants
DROP TRIGGER IF EXISTS trigger_calculate_amounts ON public.reservations;
CREATE TRIGGER trigger_calculate_amounts
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.calculate_reservation_amounts();

-- Fonction pour gérer la confirmation de livraison et libération des fonds
CREATE OR REPLACE FUNCTION public.confirm_delivery_and_release_funds(
  p_reservation_id UUID,
  p_confirmation_code TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_reservation public.reservations;
  v_result JSON;
BEGIN
  -- Récupérer la réservation
  SELECT * INTO v_reservation 
  FROM public.reservations 
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Réservation non trouvée');
  END IF;
  
  -- Vérifier que les fonds sont bien en escrow
  IF v_reservation.escrow_status != 'held' THEN
    RETURN json_build_object('success', false, 'error', 'Les fonds ne sont pas en escrow');
  END IF;
  
  -- Mettre à jour la réservation avec confirmation de livraison
  UPDATE public.reservations
  SET 
    delivery_confirmed_at = now(),
    delivery_confirmation_code = p_confirmation_code,
    escrow_status = 'released_traveler',
    status = 'completed'
  WHERE id = p_reservation_id;
  
  -- Enregistrer les earnings de la plateforme
  INSERT INTO public.platform_earnings (
    reservation_id,
    commission_amount,
    currency,
    status
  ) VALUES (
    p_reservation_id,
    v_reservation.platform_commission_amount,
    v_reservation.currency,
    'collected'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Livraison confirmée et fonds libérés',
    'traveler_amount', v_reservation.traveler_payout_amount,
    'platform_commission', v_reservation.platform_commission_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour gérer les remboursements (annulation)
CREATE OR REPLACE FUNCTION public.refund_reservation(
  p_reservation_id UUID,
  p_reason TEXT DEFAULT 'Annulation'
)
RETURNS JSON AS $$
DECLARE
  v_reservation public.reservations;
BEGIN
  SELECT * INTO v_reservation 
  FROM public.reservations 
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Réservation non trouvée');
  END IF;
  
  -- Mettre à jour le statut escrow pour remboursement
  UPDATE public.reservations
  SET 
    escrow_status = 'released_customer',
    status = 'cancelled'
  WHERE id = p_reservation_id;
  
  -- Remettre la capacité au trajet
  UPDATE public.trips 
  SET capacity_available_kg = capacity_available_kg + v_reservation.weight_kg
  WHERE id = v_reservation.trip_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Remboursement initié',
    'refund_amount', v_reservation.total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.platform_earnings IS 'Platform commission earnings from completed reservations';
COMMENT ON FUNCTION public.confirm_delivery_and_release_funds IS 'Confirm delivery and release funds to traveler';
COMMENT ON FUNCTION public.refund_reservation IS 'Process refund and restore capacity';