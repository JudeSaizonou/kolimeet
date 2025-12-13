-- Migration pour permettre à l'expéditeur d'accepter une contre-offre
-- Date: 2025-12-13
-- Description: Ajoute une fonction pour que l'expéditeur puisse accepter/refuser une contre-offre

-- Fonction: Accepter une contre-offre (par l'expéditeur)
CREATE OR REPLACE FUNCTION public.accept_counter_offer(
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
  
  -- Seul l'expéditeur (requester) peut accepter une contre-offre
  IF v_user_id != v_request.requester_id THEN
    RAISE EXCEPTION 'Only the requester can accept a counter offer';
  END IF;
  
  -- Vérifier que c'est bien une contre-offre
  IF v_request.status != 'counter_offered' THEN
    RAISE EXCEPTION 'This request is not a counter offer';
  END IF;
  
  -- Vérifier la capacité disponible
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
  
  -- Créer la réservation
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
    'Réservation créée via contre-offre acceptée'
  )
  RETURNING id INTO v_reservation_id;
  
  -- Mettre à jour la capacité du trajet
  UPDATE trips
  SET capacity_available_kg = capacity_available_kg - v_request.kilos_requested
  WHERE id = v_request.trip_id;
  
  -- Notifier le voyageur que sa contre-offre a été acceptée
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
    'counter_offer_accepted',
    'Contre-offre acceptée',
    format('Votre contre-offre de %s € pour %s kg a été acceptée', v_request.price_offered, v_request.kilos_requested),
    'reservation',
    v_reservation_id,
    false
  );
  
  -- Ajouter un message dans la conversation pour confirmer
  INSERT INTO messages (
    thread_id,
    sender_id,
    content,
    message_type,
    reservation_request_id
  ) VALUES (
    v_request.thread_id,
    v_user_id,
    format('✅ Contre-offre acceptée ! Réservation confirmée : %s kg pour %s €', v_request.kilos_requested, v_request.price_offered),
    'system',
    p_request_id
  );
  
  RETURN v_reservation_id;
END;
$$;

-- Fonction: Refuser une contre-offre (par l'expéditeur)
CREATE OR REPLACE FUNCTION public.decline_counter_offer(
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
  
  -- Seul l'expéditeur (requester) peut refuser une contre-offre
  IF v_user_id != v_request.requester_id THEN
    RAISE EXCEPTION 'Only the requester can decline a counter offer';
  END IF;
  
  -- Vérifier que c'est bien une contre-offre
  IF v_request.status != 'counter_offered' THEN
    RAISE EXCEPTION 'This request is not a counter offer';
  END IF;
  
  -- Mettre à jour le statut
  UPDATE reservation_requests
  SET status = 'declined', updated_at = now()
  WHERE id = p_request_id;
  
  -- Notifier le voyageur
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
    'counter_offer_declined',
    'Contre-offre refusée',
    format('Votre contre-offre de %s € a été refusée', v_request.price_offered),
    'reservation_request',
    p_request_id,
    false
  );
  
  -- Ajouter un message dans la conversation
  INSERT INTO messages (
    thread_id,
    sender_id,
    content,
    message_type,
    reservation_request_id
  ) VALUES (
    v_request.thread_id,
    v_user_id,
    format('❌ Contre-offre refusée. Le prix proposé de %s € ne convient pas.', v_request.price_offered),
    'system',
    p_request_id
  );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.accept_counter_offer TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_counter_offer TO authenticated;

-- Commentaires
COMMENT ON FUNCTION public.accept_counter_offer IS 'Permet à l''expéditeur d''accepter une contre-offre du voyageur';
COMMENT ON FUNCTION public.decline_counter_offer IS 'Permet à l''expéditeur de refuser une contre-offre du voyageur';
