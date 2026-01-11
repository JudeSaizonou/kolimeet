-- Migration: Add performance indexes for improved query speed
-- These indexes optimize frequently used queries in the Explorer and MyListings pages

-- ============= PARCELS INDEXES =============

-- Index for city-based searches (most common search pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcels_cities 
ON public.parcels(from_city, to_city, status) 
WHERE status = 'open' AND deleted_at IS NULL;

-- Index for deadline-based sorting and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcels_deadline 
ON public.parcels(deadline DESC, status) 
WHERE status = 'open' AND deadline > NOW() AND deleted_at IS NULL;

-- Index for user's own parcels dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcels_user_status 
ON public.parcels(user_id, status, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for type-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcels_type 
ON public.parcels(type, status, deadline DESC) 
WHERE status = 'open' AND deleted_at IS NULL;

-- Full-text search index for descriptions (French language)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcels_description_search 
ON public.parcels USING gin(to_tsvector('french', description))
WHERE deleted_at IS NULL;

-- Composite index for country searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcels_countries
ON public.parcels(from_country, to_country, status)
WHERE status = 'open' AND deleted_at IS NULL;

-- ============= TRIPS INDEXES =============

-- Index for city-based searches (most common search pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_cities 
ON public.trips(from_city, to_city, status) 
WHERE status = 'open' AND deleted_at IS NULL;

-- Index for departure date sorting and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_departure_date 
ON public.trips(date_departure ASC, status) 
WHERE status = 'open' AND date_departure > NOW() AND deleted_at IS NULL;

-- Index for available capacity filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_capacity 
ON public.trips(capacity_available_kg DESC, status) 
WHERE status = 'open' AND capacity_available_kg > 0 AND deleted_at IS NULL;

-- Index for user's own trips dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_user_status 
ON public.trips(user_id, status, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for price-based sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_price 
ON public.trips(price_expect ASC NULLS LAST, status) 
WHERE status = 'open' AND deleted_at IS NULL;

-- Full-text search index for notes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_notes_search 
ON public.trips USING gin(to_tsvector('french', notes))
WHERE deleted_at IS NULL;

-- Composite index for country searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_countries
ON public.trips(from_country, to_country, status)
WHERE status = 'open' AND deleted_at IS NULL;

-- ============= PROFILES INDEXES =============

-- Index for user lookups by email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email 
ON public.profiles(email)
WHERE deleted_at IS NULL;

-- Index for username searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_username 
ON public.profiles(username)
WHERE deleted_at IS NULL;

-- Index for trust score sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_trust_score 
ON public.profiles(trust_score DESC NULLS LAST)
WHERE deleted_at IS NULL;

-- ============= MESSAGES & THREADS INDEXES =============

-- Index for thread participants (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threads_participants 
ON public.threads(created_by, other_user_id, updated_at DESC);

-- Index for thread lookups by related listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_threads_related 
ON public.threads(related_type, related_id);

-- Index for unread messages count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread 
ON public.messages(receiver_id, read_at, created_at DESC)
WHERE read_at IS NULL;

-- Index for thread messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_thread 
ON public.messages(thread_id, created_at ASC);

-- ============= REVIEWS INDEXES =============

-- Index for user's received reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_target_user 
ON public.reviews(target_user_id, created_at DESC);

-- Index for reviewer's given reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_reviewer 
ON public.reviews(reviewer_id, created_at DESC);

-- Index for listing-related reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_related 
ON public.reviews(related_type, related_id);

-- ============= FAVORITES INDEXES =============

-- Index for user's favorites
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user 
ON public.favorites(user_id, created_at DESC);

-- Index for favorite counts per listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_listing 
ON public.favorites(favorited_type, favorited_id);

-- ============= RESERVATION REQUESTS INDEXES =============

-- Index for requester's reservations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_requester 
ON public.reservation_requests(requester_id, status, created_at DESC);

-- Index for driver's reservations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_driver 
ON public.reservation_requests(driver_id, status, created_at DESC);

-- Index for trip reservations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_trip 
ON public.reservation_requests(trip_id, status);

-- ============= REFERRALS INDEXES =============

-- Index for referrer's referrals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer 
ON public.referrals(referrer_id, status, created_at DESC);

-- Index for referred user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referred 
ON public.referrals(referred_id, status);

-- ============= FLAGS INDEXES =============

-- Index for flagged content moderation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flags_status 
ON public.flags(status, created_at DESC);

-- Index for reporter's flags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flags_reporter 
ON public.flags(reporter_id, created_at DESC);

-- Index for flagged items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flags_flagged 
ON public.flags(flagged_type, flagged_id);

-- ============= ANALYZE TABLES =============
-- Update statistics for query planner optimization

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

-- Add comments for documentation
COMMENT ON INDEX idx_parcels_cities IS 'Optimizes city-based parcel searches';
COMMENT ON INDEX idx_trips_cities IS 'Optimizes city-based trip searches';
COMMENT ON INDEX idx_parcels_deadline IS 'Optimizes deadline sorting and filtering';
COMMENT ON INDEX idx_trips_departure_date IS 'Optimizes departure date sorting and filtering';
COMMENT ON INDEX idx_profiles_trust_score IS 'Optimizes trust score based queries';
COMMENT ON INDEX idx_messages_unread IS 'Optimizes unread message counts';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully. Query performance should be significantly improved.';
END $$;
