-- =====================================================
-- MIGRATION: Système de Négociation et Réservation de Kilos
-- Description: Permet aux utilisateurs de négocier et réserver des kilos style Vinted
-- Date: 2025-11-26
-- =====================================================

-- =====================================================
-- 1. ENUM ET TYPES
-- =====================================================

-- Type pour les statuts de demande de réservation
CREATE TYPE reservation_request_status AS ENUM (
  'pending',           -- En attente de réponse du conducteur
  'accepted',          -- Acceptée par le conducteur (génère une réservation)
  'declined',          -- Refusée par le conducteur
  'counter_offered',   -- Contre-offre envoyée
  'cancelled'          -- Annulée par le demandeur
);

-- =====================================================
-- 2. TABLE PRINCIPALE: reservation_requests
-- =====================================================

CREATE TABLE public.reservation_requests (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations (avec CASCADE pour cohérence)
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  
  -- Détails de la demande
  kilos_requested DECIMAL(10, 2) NOT NULL CHECK (kilos_requested > 0),
  price_offered DECIMAL(10, 2) NOT NULL CHECK (price_offered > 0),
  
  -- Colonne calculée automatiquement (STORED pour performance)
  price_per_kg DECIMAL(10, 2) GENERATED ALWAYS AS (price_offered / NULLIF(kilos_requested, 0)) STORED,
  
  -- Workflow de statut
  status reservation_request_status NOT NULL DEFAULT 'pending',
  
  -- Relations pour les contre-offres
  counter_offer_id UUID REFERENCES public.reservation_requests(id) ON DELETE SET NULL,
  parent_request_id UUID REFERENCES public.reservation_requests(id) ON DELETE CASCADE,
  
  -- Justification (utilisée pour les contre-offres)
  justification TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- CONTRAINTES DE SÉCURITÉ
  -- Un utilisateur ne peut pas réserver son propre trajet
  CONSTRAINT different_users CHECK (requester_id != driver_id),
  
  -- Prix par kg doit être positif
  CONSTRAINT valid_price_per_kg CHECK (price_per_kg > 0)
);

-- Index unique partiel pour empêcher plusieurs demandes actives
CREATE UNIQUE INDEX unique_active_request_per_user_trip 
  ON public.reservation_requests(trip_id, requester_id) 
  WHERE status = 'pending';

-- =====================================================
-- 3. MODIFICATION TABLE MESSAGES (Support messages spéciaux)
-- =====================================================

-- Ajouter colonnes pour les messages de type réservation
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reservation_request_id UUID REFERENCES public.reservation_requests(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) NOT NULL DEFAULT 'text';

-- Contrainte: cohérence entre message_type et reservation_request_id
ALTER TABLE public.messages
  ADD CONSTRAINT reservation_message_consistency 
  CHECK (
    (message_type = 'reservation_request' AND reservation_request_id IS NOT NULL) OR
    (message_type != 'reservation_request')
  );

-- =====================================================
-- 4. INDEX POUR PERFORMANCE
-- =====================================================

-- Index simples sur colonnes fréquemment requêtées
CREATE INDEX idx_reservation_requests_thread ON public.reservation_requests(thread_id);
CREATE INDEX idx_reservation_requests_trip ON public.reservation_requests(trip_id);
CREATE INDEX idx_reservation_requests_requester ON public.reservation_requests(requester_id);
CREATE INDEX idx_reservation_requests_driver ON public.reservation_requests(driver_id);
CREATE INDEX idx_reservation_requests_status ON public.reservation_requests(status);
CREATE INDEX idx_reservation_requests_parent ON public.reservation_requests(parent_request_id);
CREATE INDEX idx_reservation_requests_created_at ON public.reservation_requests(created_at DESC);

-- Index composites pour requêtes complexes
CREATE INDEX idx_reservation_requests_thread_status 
  ON public.reservation_requests(thread_id, status);
CREATE INDEX idx_reservation_requests_trip_status 
  ON public.reservation_requests(trip_id, status);
CREATE INDEX idx_reservation_requests_trip_requester 
  ON public.reservation_requests(trip_id, requester_id);

-- Index sur messages pour les demandes de réservation
CREATE INDEX idx_messages_reservation_request ON public.messages(reservation_request_id) WHERE reservation_request_id IS NOT NULL;
CREATE INDEX idx_messages_type ON public.messages(message_type);

-- =====================================================
-- 5. TRIGGERS (Auto-update timestamps)
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_reservation_requests_updated_at
  BEFORE UPDATE ON public.reservation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 6. RLS POLICIES (Sécurité Row-Level)
-- =====================================================

-- Activer RLS
ALTER TABLE public.reservation_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Les utilisateurs voient uniquement leurs demandes
CREATE POLICY "Users can view their reservation requests"
  ON public.reservation_requests FOR SELECT
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = driver_id OR
    public.has_role(auth.uid(), 'admin')
  );

-- Policy 2: INSERT - Seul le requester peut créer une demande
CREATE POLICY "Requesters can create reservation requests"
  ON public.reservation_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    -- Vérifier que le requester n'est pas le driver
    requester_id != driver_id
  );

-- Policy 3: UPDATE - Le driver peut accepter/refuser/faire contre-offre
CREATE POLICY "Drivers can update request status"
  ON public.reservation_requests FOR UPDATE
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- Policy 4: UPDATE - Le requester peut annuler sa demande ou accepter une contre-offre
CREATE POLICY "Requesters can update their requests"
  ON public.reservation_requests FOR UPDATE
  USING (auth.uid() = requester_id)
  WITH CHECK (auth.uid() = requester_id);

-- Policy 5: DELETE - Personne ne peut supprimer (soft delete via status)
CREATE POLICY "No one can delete reservation requests"
  ON public.reservation_requests FOR DELETE
  USING (false);

-- =====================================================
-- 7. FONCTIONS SQL (Business Logic)
-- =====================================================

-- ---------------------
-- Fonction 1: Créer une demande de réservation
-- ---------------------
CREATE OR REPLACE FUNCTION public.create_reservation_request(
  p_thread_id UUID,
  p_trip_id UUID,
  p_kilos DECIMAL,
  p_price DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_id UUID;
  v_driver_id UUID;
  v_capacity_available DECIMAL;
  v_request_id UUID;
  v_message_id UUID;
  v_active_requests_count INT;
BEGIN
  -- Récupérer l'utilisateur connecté
  v_requester_id := auth.uid();
  
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Récupérer le driver_id et la capacité disponible
  SELECT user_id, capacity_available_kg 
  INTO v_driver_id, v_capacity_available
  FROM trips 
  WHERE id = p_trip_id;
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;
  
  -- VALIDATION 1: Empêcher de réserver son propre trajet
  IF v_requester_id = v_driver_id THEN
    RAISE EXCEPTION 'Cannot reserve your own trip';
  END IF;
  
  -- VALIDATION 2: Vérifier la capacité disponible
  IF v_capacity_available < p_kilos THEN
    RAISE EXCEPTION 'Insufficient capacity available (% kg requested, % kg available)', 
      p_kilos, v_capacity_available;
  END IF;
  
  -- VALIDATION 3: Vérifier qu'il n'y a pas déjà une demande active
  SELECT COUNT(*) INTO v_active_requests_count
  FROM reservation_requests
  WHERE trip_id = p_trip_id 
    AND requester_id = v_requester_id 
    AND status = 'pending';
  
  IF v_active_requests_count > 0 THEN
    RAISE EXCEPTION 'You already have a pending request for this trip';
  END IF;
  
  -- VALIDATION 4: Prix positif
  IF p_price <= 0 OR p_kilos <= 0 THEN
    RAISE EXCEPTION 'Price and kilos must be positive';
  END IF;
  
  -- Créer la demande de réservation
  INSERT INTO reservation_requests (
    thread_id,
    trip_id,
    requester_id,
    driver_id,
    kilos_requested,
    price_offered,
    status
  ) VALUES (
    p_thread_id,
    p_trip_id,
    v_requester_id,
    v_driver_id,
    p_kilos,
    p_price,
    'pending'
  )
  RETURNING id INTO v_request_id;
  
  -- Créer le message spécial dans le thread
  INSERT INTO messages (
    thread_id,
    sender_id,
    content,
    message_type,
    reservation_request_id
  ) VALUES (
    p_thread_id,
    v_requester_id,
    format('Demande de réservation : %s kg pour %s €', p_kilos, p_price),
    'reservation_request',
    v_request_id
  )
  RETURNING id INTO v_message_id;
  
  -- Lier le message à la demande
  UPDATE reservation_requests 
  SET message_id = v_message_id 
  WHERE id = v_request_id;
  
  -- Créer une notification pour le driver
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    read
  ) VALUES (
    v_driver_id,
    'reservation_request',
    'Nouvelle demande de réservation',
    format('Demande de %s kg pour %s €', p_kilos, p_price),
    'reservation_request',
    v_request_id,
    false
  );
  
  RETURN v_request_id;
END;
$$;

-- ---------------------
-- Fonction 2: Accepter une demande de réservation
-- ---------------------
CREATE OR REPLACE FUNCTION public.accept_reservation_request(
  p_request_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_request RECORD;
  v_reservation_id UUID;
  v_capacity_available DECIMAL;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Récupérer les détails de la demande
  SELECT * INTO v_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Reservation request not found';
  END IF;
  
  -- VALIDATION 1: Seul le driver peut accepter
  IF v_user_id != v_request.driver_id THEN
    RAISE EXCEPTION 'Only the driver can accept this request';
  END IF;
  
  -- VALIDATION 2: La demande doit être en attente ou counter_offered
  IF v_request.status NOT IN ('pending', 'counter_offered') THEN
    RAISE EXCEPTION 'Request is not in pending or counter_offered status';
  END IF;
  
  -- VALIDATION 3: Vérifier la capacité disponible (au cas où d'autres réservations ont été faites)
  SELECT capacity_available_kg INTO v_capacity_available
  FROM trips
  WHERE id = v_request.trip_id;
  
  IF v_capacity_available < v_request.kilos_requested THEN
    RAISE EXCEPTION 'Insufficient capacity available';
  END IF;
  
  -- Mettre à jour le statut de la demande
  UPDATE reservation_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = p_request_id;
  
  -- Créer la réservation dans la table reservations
  INSERT INTO reservations (
    trip_id,
    user_id,
    weight_kg,
    price_per_kg,
    total_amount,
    status,
    payment_status,
    message
  ) VALUES (
    v_request.trip_id,
    v_request.requester_id,
    v_request.kilos_requested,
    v_request.price_per_kg,
    v_request.price_offered,
    'confirmed',
    'pending',
    'Réservation créée via négociation'
  )
  RETURNING id INTO v_reservation_id;
  
  -- Décrémenter la capacité disponible du trajet
  UPDATE trips
  SET capacity_available_kg = capacity_available_kg - v_request.kilos_requested
  WHERE id = v_request.trip_id;
  
  -- Créer une notification pour le requester
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    read
  ) VALUES (
    v_request.requester_id,
    'reservation_accepted',
    'Demande acceptée',
    format('Votre demande de %s kg a été acceptée', v_request.kilos_requested),
    'reservation',
    v_reservation_id,
    false
  );
  
  RETURN v_reservation_id;
END;
$$;

-- ---------------------
-- Fonction 3: Refuser une demande de réservation
-- ---------------------
CREATE OR REPLACE FUNCTION public.decline_reservation_request(
  p_request_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_request RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Récupérer les détails de la demande
  SELECT * INTO v_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Reservation request not found';
  END IF;
  
  -- VALIDATION: Seul le driver peut refuser
  IF v_user_id != v_request.driver_id THEN
    RAISE EXCEPTION 'Only the driver can decline this request';
  END IF;
  
  -- VALIDATION: La demande doit être en attente
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not in pending status';
  END IF;
  
  -- Mettre à jour le statut
  UPDATE reservation_requests
  SET status = 'declined', updated_at = now()
  WHERE id = p_request_id;
  
  -- Créer une notification pour le requester
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    read
  ) VALUES (
    v_request.requester_id,
    'reservation_declined',
    'Demande refusée',
    format('Votre demande de %s kg a été refusée', v_request.kilos_requested),
    'reservation_request',
    p_request_id,
    false
  );
END;
$$;

-- ---------------------
-- Fonction 4: Créer une contre-offre
-- ---------------------
CREATE OR REPLACE FUNCTION public.create_counter_offer(
  p_request_id UUID,
  p_new_price DECIMAL,
  p_justification TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_original_request RECORD;
  v_counter_offer_id UUID;
  v_message_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Récupérer la demande originale
  SELECT * INTO v_original_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_original_request IS NULL THEN
    RAISE EXCEPTION 'Original request not found';
  END IF;
  
  -- VALIDATION 1: Seul le driver peut faire une contre-offre
  IF v_user_id != v_original_request.driver_id THEN
    RAISE EXCEPTION 'Only the driver can make a counter offer';
  END IF;
  
  -- VALIDATION 2: La demande doit être en attente
  IF v_original_request.status != 'pending' THEN
    RAISE EXCEPTION 'Can only counter offer on pending requests';
  END IF;
  
  -- VALIDATION 3: Le nouveau prix doit être positif et différent
  IF p_new_price <= 0 THEN
    RAISE EXCEPTION 'Price must be positive';
  END IF;
  
  IF p_new_price = v_original_request.price_offered THEN
    RAISE EXCEPTION 'Counter offer price must be different from original price';
  END IF;
  
  -- Créer la contre-offre (nouvelle demande)
  INSERT INTO reservation_requests (
    thread_id,
    trip_id,
    requester_id,
    driver_id,
    kilos_requested,
    price_offered,
    status,
    parent_request_id,
    justification
  ) VALUES (
    v_original_request.thread_id,
    v_original_request.trip_id,
    v_original_request.requester_id,
    v_original_request.driver_id,
    v_original_request.kilos_requested,
    p_new_price,
    'pending',
    p_request_id,
    p_justification
  )
  RETURNING id INTO v_counter_offer_id;
  
  -- Mettre à jour la demande originale
  UPDATE reservation_requests
  SET 
    status = 'counter_offered',
    counter_offer_id = v_counter_offer_id,
    updated_at = now()
  WHERE id = p_request_id;
  
  -- Créer le message de contre-offre dans le thread
  INSERT INTO messages (
    thread_id,
    sender_id,
    content,
    message_type,
    reservation_request_id
  ) VALUES (
    v_original_request.thread_id,
    v_user_id,
    format('Contre-proposition : %s kg pour %s € (au lieu de %s €)', 
      v_original_request.kilos_requested, p_new_price, v_original_request.price_offered),
    'reservation_request',
    v_counter_offer_id
  )
  RETURNING id INTO v_message_id;
  
  -- Lier le message à la contre-offre
  UPDATE reservation_requests 
  SET message_id = v_message_id 
  WHERE id = v_counter_offer_id;
  
  -- Créer une notification pour le requester
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    read
  ) VALUES (
    v_original_request.requester_id,
    'counter_offer',
    'Nouvelle contre-proposition',
    format('Le conducteur propose %s € pour %s kg', p_new_price, v_original_request.kilos_requested),
    'reservation_request',
    v_counter_offer_id,
    false
  );
  
  RETURN v_counter_offer_id;
END;
$$;

-- ---------------------
-- Fonction 5: Annuler une demande de réservation
-- ---------------------
CREATE OR REPLACE FUNCTION public.cancel_reservation_request(
  p_request_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_request RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Récupérer les détails de la demande
  SELECT * INTO v_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Reservation request not found';
  END IF;
  
  -- VALIDATION: Seul le requester peut annuler
  IF v_user_id != v_request.requester_id THEN
    RAISE EXCEPTION 'Only the requester can cancel this request';
  END IF;
  
  -- VALIDATION: La demande doit être en attente ou counter_offered
  IF v_request.status NOT IN ('pending', 'counter_offered') THEN
    RAISE EXCEPTION 'Can only cancel pending or counter offered requests';
  END IF;
  
  -- Mettre à jour le statut
  UPDATE reservation_requests
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_request_id;
  
  -- Créer une notification pour le driver
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    read
  ) VALUES (
    v_request.driver_id,
    'reservation_cancelled',
    'Demande annulée',
    format('La demande de %s kg a été annulée', v_request.kilos_requested),
    'reservation_request',
    p_request_id,
    false
  );
END;
$$;

-- =====================================================
-- 8. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour récupérer les demandes actives d'un thread
CREATE OR REPLACE FUNCTION public.get_thread_reservation_requests(
  p_thread_id UUID
)
RETURNS TABLE (
  id UUID,
  trip_id UUID,
  requester_id UUID,
  driver_id UUID,
  kilos_requested DECIMAL,
  price_offered DECIMAL,
  price_per_kg DECIMAL,
  status reservation_request_status,
  parent_request_id UUID,
  justification TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, trip_id, requester_id, driver_id,
    kilos_requested, price_offered, price_per_kg,
    status, parent_request_id, justification,
    created_at, updated_at
  FROM reservation_requests
  WHERE thread_id = p_thread_id
  ORDER BY created_at DESC;
$$;

-- Fonction pour compter les demandes actives d'un utilisateur
CREATE OR REPLACE FUNCTION public.count_user_active_requests(
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM reservation_requests
  WHERE (requester_id = COALESCE(p_user_id, auth.uid()) OR driver_id = COALESCE(p_user_id, auth.uid()))
    AND status = 'pending';
$$;

-- =====================================================
-- 9. COMMENTAIRES (Documentation)
-- =====================================================

COMMENT ON TABLE public.reservation_requests IS 'Demandes de réservation de kilos avec négociation style Vinted';
COMMENT ON COLUMN public.reservation_requests.price_per_kg IS 'Prix par kg calculé automatiquement (STORED pour performance)';
COMMENT ON COLUMN public.reservation_requests.counter_offer_id IS 'Référence vers la contre-offre si elle existe';
COMMENT ON COLUMN public.reservation_requests.parent_request_id IS 'Référence vers la demande parente (pour les contre-offres)';
COMMENT ON FUNCTION public.create_reservation_request IS 'Crée une demande de réservation avec validations (capacité, unicité, sécurité)';
COMMENT ON FUNCTION public.accept_reservation_request IS 'Accepte une demande et crée une réservation effective';
COMMENT ON FUNCTION public.decline_reservation_request IS 'Refuse une demande de réservation';
COMMENT ON FUNCTION public.create_counter_offer IS 'Crée une contre-proposition de prix';
COMMENT ON FUNCTION public.cancel_reservation_request IS 'Annule une demande (uniquement par le requester)';

-- =====================================================
-- 10. GRANTS (Permissions)
-- =====================================================

-- Permettre aux utilisateurs authentifiés d'utiliser les fonctions
GRANT EXECUTE ON FUNCTION public.create_reservation_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_reservation_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_reservation_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_counter_offer TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread_reservation_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_user_active_requests TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
