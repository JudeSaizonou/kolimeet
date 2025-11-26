-- Migration pour corriger les noms de colonnes des notifications dans les fonctions de réservation
-- Date: 2025-11-26
-- Description: Remplace entity_type/entity_id par related_type/related_id

-- Fonction 1: Créer une demande de réservation (CORRECTION)
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
  v_requester_id := auth.uid();
  
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  SELECT user_id, capacity_available_kg 
  INTO v_driver_id, v_capacity_available
  FROM trips 
  WHERE id = p_trip_id;
  
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'Trip not found';
  END IF;
  
  IF v_requester_id = v_driver_id THEN
    RAISE EXCEPTION 'Cannot reserve your own trip';
  END IF;
  
  IF v_capacity_available < p_kilos THEN
    RAISE EXCEPTION 'Insufficient capacity available (% kg requested, % kg available)', 
      p_kilos, v_capacity_available;
  END IF;
  
  SELECT COUNT(*) INTO v_active_requests_count
  FROM reservation_requests
  WHERE trip_id = p_trip_id 
    AND requester_id = v_requester_id 
    AND status = 'pending';
  
  IF v_active_requests_count > 0 THEN
    RAISE EXCEPTION 'You already have a pending request for this trip';
  END IF;
  
  IF p_price <= 0 OR p_kilos <= 0 THEN
    RAISE EXCEPTION 'Price and kilos must be positive';
  END IF;
  
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
  
  UPDATE reservation_requests 
  SET message_id = v_message_id 
  WHERE id = v_request_id;
  
  -- CORRECTION: Utiliser related_type et related_id au lieu de entity_type et entity_id
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_type,
    related_id,
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

-- Fonction 2: Accepter une demande (CORRECTION)
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
  
  SELECT * INTO v_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Reservation request not found';
  END IF;
  
  IF v_user_id != v_request.driver_id THEN
    RAISE EXCEPTION 'Only the driver can accept this request';
  END IF;
  
  IF v_request.status NOT IN ('pending', 'counter_offered') THEN
    RAISE EXCEPTION 'Request is not in pending or counter_offered status';
  END IF;
  
  SELECT capacity_available_kg INTO v_capacity_available
  FROM trips
  WHERE id = v_request.trip_id;
  
  IF v_capacity_available < v_request.kilos_requested THEN
    RAISE EXCEPTION 'Insufficient capacity available';
  END IF;
  
  UPDATE reservation_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = p_request_id;
  
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
  
  UPDATE trips
  SET capacity_available_kg = capacity_available_kg - v_request.kilos_requested
  WHERE id = v_request.trip_id;
  
  -- CORRECTION: Utiliser related_type et related_id
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_type,
    related_id,
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

-- Fonction 3: Refuser une demande (CORRECTION)
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
  
  SELECT * INTO v_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Reservation request not found';
  END IF;
  
  IF v_user_id != v_request.driver_id THEN
    RAISE EXCEPTION 'Only the driver can decline this request';
  END IF;
  
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not in pending status';
  END IF;
  
  UPDATE reservation_requests
  SET status = 'declined', updated_at = now()
  WHERE id = p_request_id;
  
  -- CORRECTION: Utiliser related_type et related_id
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_type,
    related_id,
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

-- Fonction 4: Créer une contre-offre (CORRECTION)
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
  
  SELECT * INTO v_original_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_original_request IS NULL THEN
    RAISE EXCEPTION 'Original request not found';
  END IF;
  
  IF v_user_id != v_original_request.driver_id THEN
    RAISE EXCEPTION 'Only the driver can make a counter offer';
  END IF;
  
  IF v_original_request.status != 'pending' THEN
    RAISE EXCEPTION 'Can only counter offer on pending requests';
  END IF;
  
  IF p_new_price <= 0 THEN
    RAISE EXCEPTION 'Price must be positive';
  END IF;
  
  IF p_new_price = v_original_request.price_offered THEN
    RAISE EXCEPTION 'Counter offer price must be different from original price';
  END IF;
  
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
  
  UPDATE reservation_requests
  SET 
    status = 'counter_offered',
    counter_offer_id = v_counter_offer_id,
    updated_at = now()
  WHERE id = p_request_id;
  
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
  
  UPDATE reservation_requests 
  SET message_id = v_message_id 
  WHERE id = v_counter_offer_id;
  
  -- CORRECTION: Utiliser related_type et related_id
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_type,
    related_id,
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

-- Fonction 5: Annuler une demande (CORRECTION)
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
  
  SELECT * INTO v_request
  FROM reservation_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Reservation request not found';
  END IF;
  
  IF v_user_id != v_request.requester_id THEN
    RAISE EXCEPTION 'Only the requester can cancel this request';
  END IF;
  
  IF v_request.status NOT IN ('pending', 'counter_offered') THEN
    RAISE EXCEPTION 'Can only cancel pending or counter offered requests';
  END IF;
  
  UPDATE reservation_requests
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_request_id;
  
  -- CORRECTION: Utiliser related_type et related_id
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_type,
    related_id,
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
