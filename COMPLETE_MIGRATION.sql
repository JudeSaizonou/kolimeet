-- ============================================================================
-- MIGRATION COMPLÈTE Kolimeet - À exécuter dans le SQL Editor de Supabase
-- Projet: odzxqpaovgxcwqilildp
-- Date: 23 novembre 2025
-- ============================================================================

-- PARTIE 1: CONTRAINTES CASCADE (20251029124252)
-- ============================================================================
-- Drop existing foreign keys and recreate with CASCADE
ALTER TABLE parcels DROP CONSTRAINT IF EXISTS parcels_user_id_fkey;
ALTER TABLE parcels ADD CONSTRAINT parcels_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_user_id_fkey;
ALTER TABLE trips ADD CONSTRAINT trips_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewer_id_fkey 
  FOREIGN KEY (reviewer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_target_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_target_user_id_fkey 
  FOREIGN KEY (target_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_created_by_fkey;
ALTER TABLE threads ADD CONSTRAINT threads_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_other_user_id_fkey;
ALTER TABLE threads ADD CONSTRAINT threads_other_user_id_fkey 
  FOREIGN KEY (other_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_user_id_fkey;
ALTER TABLE feedbacks ADD CONSTRAINT feedbacks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE flags DROP CONSTRAINT IF EXISTS flags_reporter_id_fkey;
ALTER TABLE flags ADD CONSTRAINT flags_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE phone_verification_codes DROP CONSTRAINT IF EXISTS phone_verification_codes_user_id_fkey;
ALTER TABLE phone_verification_codes ADD CONSTRAINT phone_verification_codes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;


-- PARTIE 2: FONCTION ADMIN (20251029125334)
-- ============================================================================
-- Create a function to check if user is admin that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'::app_role
  );
$$;


-- PARTIE 3: POLICIES ADMIN PROFILES (20251029141500)
-- ============================================================================
-- Add admin policies for profiles table to allow user management
-- Admins can update any profile (for suspension, etc.)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete any profile
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));


-- PARTIE 4: TABLE RESERVATIONS (20251030150000)
-- ============================================================================
-- Create reservations table for booking capacity with payment
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 0),
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg >= 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'paid', 'cancelled', 'completed'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'processing', 'paid', 'failed', 'refunded'
  )),
  stripe_payment_intent_id TEXT,
  message TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_trip ON public.reservations(trip_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment ON public.reservations(payment_status);

-- RLS Policies
CREATE POLICY "Users can view their reservations"
ON public.reservations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
ON public.reservations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reservations"
ON public.reservations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Trip owners can view reservations"
ON public.reservations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.trips 
  WHERE trips.id = reservations.trip_id 
  AND trips.user_id = auth.uid()
));

CREATE POLICY "Trip owners can update reservations"
ON public.reservations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.trips 
  WHERE trips.id = reservations.trip_id 
  AND trips.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all reservations"
ON public.reservations FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update trip capacity
CREATE OR REPLACE FUNCTION public.handle_reservation_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE public.trips 
    SET capacity_available_kg = capacity_available_kg - NEW.weight_kg
    WHERE id = NEW.trip_id;
  END IF;
  
  IF OLD.status = 'paid' AND NEW.status IN ('cancelled', 'refunded') THEN
    UPDATE public.trips 
    SET capacity_available_kg = capacity_available_kg + NEW.weight_kg
    WHERE id = NEW.trip_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_reservation_capacity
AFTER UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_capacity();


-- PARTIE 5: SYSTÈME ESCROW (20251030160000)
-- ============================================================================
-- Ajout des colonnes escrow aux réservations
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS escrow_status TEXT NOT NULL DEFAULT 'pending' 
  CHECK (escrow_status IN ('pending', 'held', 'released_traveler', 'released_customer', 'partially_released'));

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS platform_commission_rate NUMERIC DEFAULT 0.05 
  CHECK (platform_commission_rate >= 0 AND platform_commission_rate <= 1);
  
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS platform_commission_amount NUMERIC DEFAULT 0 
  CHECK (platform_commission_amount >= 0);
  
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS traveler_payout_amount NUMERIC DEFAULT 0 
  CHECK (traveler_payout_amount >= 0);
  
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_method TEXT 
  CHECK (payment_method IN ('stripe_card', 'orange_money', 'mtn_money', 'wave', 'moov_money', 'bank_transfer'));

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_confirmation_code TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payout_processed_at TIMESTAMPTZ;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payout_reference TEXT;

-- Table platform_earnings
CREATE TABLE IF NOT EXISTS public.platform_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  commission_amount NUMERIC NOT NULL CHECK (commission_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view platform earnings"
ON public.platform_earnings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_escrow_status ON public.reservations(escrow_status);
CREATE INDEX IF NOT EXISTS idx_reservations_currency ON public.reservations(currency);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_earned_at ON public.platform_earnings(earned_at);

-- Fonction de calcul automatique
CREATE OR REPLACE FUNCTION public.calculate_reservation_amounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_commission_amount := NEW.total_amount * COALESCE(NEW.platform_commission_rate, 0.05);
  NEW.traveler_payout_amount := NEW.total_amount - NEW.platform_commission_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_amounts ON public.reservations;
CREATE TRIGGER trigger_calculate_amounts
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.calculate_reservation_amounts();

-- Fonction de confirmation de livraison
CREATE OR REPLACE FUNCTION public.confirm_delivery_and_release_funds(
  p_reservation_id UUID,
  p_confirmation_code TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_reservation public.reservations;
  v_result JSON;
BEGIN
  SELECT * INTO v_reservation 
  FROM public.reservations 
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Réservation non trouvée');
  END IF;
  
  IF v_reservation.escrow_status != 'held' THEN
    RETURN json_build_object('success', false, 'error', 'Les fonds ne sont pas en escrow');
  END IF;
  
  UPDATE public.reservations
  SET 
    delivery_confirmed_at = now(),
    delivery_confirmation_code = p_confirmation_code,
    escrow_status = 'released_traveler',
    status = 'completed'
  WHERE id = p_reservation_id;
  
  INSERT INTO public.platform_earnings (
    reservation_id, commission_amount, currency, status
  ) VALUES (
    p_reservation_id, v_reservation.platform_commission_amount, 
    v_reservation.currency, 'collected'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Livraison confirmée et fonds libérés',
    'traveler_amount', v_reservation.traveler_payout_amount,
    'platform_commission', v_reservation.platform_commission_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de remboursement
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
  
  UPDATE public.reservations
  SET escrow_status = 'released_customer', status = 'cancelled'
  WHERE id = p_reservation_id;
  
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


-- PARTIE 6: TYPING STATUS (20251103000000)
-- ============================================================================
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_status_thread_id ON typing_status(thread_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_user_id ON typing_status(user_id);

ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing status in their threads"
ON typing_status FOR SELECT
USING (
  thread_id IN (
    SELECT id FROM threads 
    WHERE created_by = auth.uid() OR other_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own typing status"
ON typing_status FOR ALL
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION cleanup_old_typing_status()
RETURNS trigger AS $$
BEGIN
  DELETE FROM typing_status
  WHERE updated_at < NOW() - INTERVAL '10 seconds'
    AND is_typing = true;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_typing_status_trigger
AFTER INSERT OR UPDATE ON typing_status
EXECUTE FUNCTION cleanup_old_typing_status();


-- PARTIE 7: REPLICA IDENTITY (20251103204828)
-- ============================================================================
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.parcels REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.flags REPLICA IDENTITY FULL;
ALTER TABLE public.threads REPLICA IDENTITY FULL;


-- ============================================================================
-- FIN DES MIGRATIONS
-- ============================================================================
-- Toutes les migrations ont été appliquées avec succès!
-- Prochaine étape: Configurer les secrets et tester l'application
