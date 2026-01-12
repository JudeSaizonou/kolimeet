-- Migration pour corriger les problèmes de sécurité détectés par le linter
-- 1. Remplacer SECURITY DEFINER par SECURITY INVOKER sur les vues
-- 2. Supprimer ou activer RLS sur la table de backup

-- Fix 1: favorites_with_details - Recréer avec SECURITY INVOKER
DROP VIEW IF EXISTS public.favorites_with_details;
CREATE VIEW public.favorites_with_details
WITH (security_invoker = true)
AS
SELECT 
  f.id,
  f.user_id,
  f.item_type,
  f.item_id,
  f.created_at,
  CASE 
    WHEN f.item_type = 'trip' THEN (
      SELECT json_build_object(
        'id', t.id,
        'from_city', t.from_city,
        'from_country', t.from_country,
        'to_city', t.to_city,
        'to_country', t.to_country,
        'date_departure', t.date_departure,
        'capacity_kg', t.capacity_kg,
        'capacity_available_kg', t.capacity_available_kg,
        'price_expect', t.price_expect,
        'status', t.status,
        'user_id', t.user_id
      )
      FROM public.trips t
      WHERE t.id = f.item_id
    )
    WHEN f.item_type = 'parcel' THEN (
      SELECT json_build_object(
        'id', p.id,
        'from_city', p.from_city,
        'from_country', p.from_country,
        'to_city', p.to_city,
        'to_country', p.to_country,
        'deadline', p.deadline,
        'type', p.type,
        'weight_kg', p.weight_kg,
        'size', p.size,
        'status', p.status,
        'user_id', p.user_id
      )
      FROM public.parcels p
      WHERE p.id = f.item_id
    )
  END as item_details
FROM public.favorites f;

GRANT SELECT ON public.favorites_with_details TO authenticated;
COMMENT ON VIEW public.favorites_with_details IS 'Vue avec les détails complets des favoris (SECURITY INVOKER)';

-- Fix 2: thread_message_stats - Recréer avec SECURITY INVOKER
DROP VIEW IF EXISTS public.thread_message_stats;
CREATE VIEW public.thread_message_stats
WITH (security_invoker = true)
AS
WITH last_messages AS (
  SELECT
    m.*,
    ROW_NUMBER() OVER (PARTITION BY m.thread_id ORDER BY m.created_at DESC, m.id DESC) AS rn
  FROM public.messages m
),
thread_stats AS (
  SELECT 
    t.id as thread_id,
    COUNT(m.id) as total_messages,
    COUNT(m.id) FILTER (WHERE m.read_at IS NULL) as unread_messages,
    MAX(m.created_at) as last_message_at
  FROM public.threads t
  LEFT JOIN public.messages m ON m.thread_id = t.id
  GROUP BY t.id
)
SELECT 
  ts.thread_id,
  ts.total_messages,
  ts.unread_messages,
  ts.last_message_at,
  lm.content as last_message_content
FROM thread_stats ts
LEFT JOIN last_messages lm 
  ON lm.thread_id = ts.thread_id AND lm.rn = 1;

GRANT SELECT ON public.thread_message_stats TO authenticated;
COMMENT ON VIEW public.thread_message_stats IS 'Statistics about messages in each thread (SECURITY INVOKER)';

-- Fix 3: parcel_matches_detailed - Recréer avec SECURITY INVOKER
DROP VIEW IF EXISTS public.parcel_matches_detailed;
CREATE VIEW public.parcel_matches_detailed
WITH (security_invoker = true)
AS
SELECT 
  pm.id,
  pm.parcel_id,
  pm.trip_id,
  pm.match_score,
  pm.status,
  pm.created_at,
  -- Infos du colis
  p.type as parcel_type,
  p.weight_kg,
  p.size,
  p.from_country as parcel_from_country,
  p.from_city as parcel_from_city,
  p.to_country as parcel_to_country,
  p.to_city as parcel_to_city,
  p.deadline,
  p.user_id as parcel_user_id,
  -- Infos du trajet
  t.from_country as trip_from_country,
  t.from_city as trip_from_city,
  t.to_country as trip_to_country,
  t.to_city as trip_to_city,
  t.date_departure,
  t.capacity_available_kg,
  t.price_expect,
  t.user_id as trip_user_id
FROM public.parcel_matches pm
JOIN public.parcels p ON pm.parcel_id = p.id
JOIN public.trips t ON pm.trip_id = t.id;

GRANT SELECT ON public.parcel_matches_detailed TO authenticated;
COMMENT ON VIEW public.parcel_matches_detailed IS 'Vue détaillée des correspondances colis-trajets (SECURITY INVOKER)';

-- Fix 4: bookings_with_profiles - Recréer avec SECURITY INVOKER
DROP VIEW IF EXISTS public.bookings_with_profiles;
CREATE VIEW public.bookings_with_profiles
WITH (security_invoker = true)
AS
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

GRANT SELECT ON public.bookings_with_profiles TO authenticated;
COMMENT ON VIEW public.bookings_with_profiles IS 'Vue des réservations avec profils (SECURITY INVOKER)';

-- Fix 5: Supprimer la table de backup obsolète si elle existe
-- Cette table était une sauvegarde temporaire et n'est plus nécessaire
DROP TABLE IF EXISTS public.parcel_matches_backup_20241126;
