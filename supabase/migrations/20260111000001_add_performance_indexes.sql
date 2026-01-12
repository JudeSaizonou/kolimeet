-- Migration: Add performance indexes for improved query speed
-- Version épurée sans colonnes inexistantes

-- ============= PARCELS INDEXES =============

CREATE INDEX IF NOT EXISTS idx_parcels_cities 
ON public.parcels(from_city, to_city, status) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_parcels_user_status 
ON public.parcels(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parcels_countries
ON public.parcels(from_country, to_country, status)
WHERE status = 'open';

-- ============= TRIPS INDEXES =============

CREATE INDEX IF NOT EXISTS idx_trips_cities 
ON public.trips(from_city, to_city, status) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_trips_departure_date 
ON public.trips(date_departure ASC, status) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_trips_user_status 
ON public.trips(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trips_countries
ON public.trips(from_country, to_country, status)
WHERE status = 'open';

-- ============= PROFILES INDEXES =============

CREATE INDEX IF NOT EXISTS idx_profiles_trust_score 
ON public.profiles(trust_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_profiles_rating 
ON public.profiles(rating_avg DESC NULLS LAST);

-- ============= MESSAGES & THREADS INDEXES =============

CREATE INDEX IF NOT EXISTS idx_threads_participants 
ON public.threads(created_by, other_user_id);

CREATE INDEX IF NOT EXISTS idx_threads_related 
ON public.threads(related_type, related_id);

CREATE INDEX IF NOT EXISTS idx_messages_thread 
ON public.messages(thread_id, created_at ASC);

-- ============= REVIEWS INDEXES =============

CREATE INDEX IF NOT EXISTS idx_reviews_target_user 
ON public.reviews(target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer 
ON public.reviews(reviewer_id, created_at DESC);

-- ============= FAVORITES INDEXES =============

CREATE INDEX IF NOT EXISTS idx_favorites_user 
ON public.favorites(user_id, created_at DESC);

-- ============= RESERVATION REQUESTS INDEXES =============

CREATE INDEX IF NOT EXISTS idx_reservations_requester 
ON public.reservation_requests(requester_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_driver 
ON public.reservation_requests(driver_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_trip 
ON public.reservation_requests(trip_id, status);

-- ============= REFERRALS INDEXES =============

CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
ON public.referrals(referrer_id, created_at DESC);

-- ============= FLAGS INDEXES =============

CREATE INDEX IF NOT EXISTS idx_flags_status 
ON public.flags(status, created_at DESC);

-- ============= ANALYZE TABLES =============

ANALYZE public.parcels;
ANALYZE public.trips;
ANALYZE public.profiles;
ANALYZE public.messages;
ANALYZE public.threads;
ANALYZE public.reviews;
ANALYZE public.favorites;
ANALYZE public.reservation_requests;
ANALYZE public.referrals;
ANALYZE public.flags;
