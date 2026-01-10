-- Add referral requirement tracking to parcels and trips tables
-- This enables requiring users to complete referrals before their listings become visible

-- Add columns to parcels
ALTER TABLE public.parcels 
ADD COLUMN IF NOT EXISTS requires_referrals INTEGER DEFAULT 0 CHECK (requires_referrals >= 0),
ADD COLUMN IF NOT EXISTS verified_referrals_count INTEGER DEFAULT 0 CHECK (verified_referrals_count >= 0);

-- Add columns to trips
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS requires_referrals INTEGER DEFAULT 0 CHECK (requires_referrals >= 0),
ADD COLUMN IF NOT EXISTS verified_referrals_count INTEGER DEFAULT 0 CHECK (verified_referrals_count >= 0);

-- Add indexes for filtering visible listings
CREATE INDEX IF NOT EXISTS idx_parcels_visibility ON public.parcels(user_id, verified_referrals_count, requires_referrals) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_trips_visibility ON public.trips(user_id, verified_referrals_count, requires_referrals) 
WHERE status = 'open';

-- Function to check if a listing is visible to the public
-- A listing is visible if: verified_referrals_count >= requires_referrals
CREATE OR REPLACE FUNCTION public.is_listing_visible(
  p_verified_referrals_count INTEGER,
  p_requires_referrals INTEGER
)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT p_verified_referrals_count >= p_requires_referrals;
$$;

-- Function to update listing visibility when referrals are accepted
-- This function counts accepted referrals and updates all user's listings
CREATE OR REPLACE FUNCTION public.update_user_listing_visibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_accepted_count INTEGER;
BEGIN
  -- Only process when a referral is accepted (status changes to 'accepted')
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    
    -- Count total accepted referrals for the referrer
    SELECT COUNT(*)
    INTO v_referrer_accepted_count
    FROM referrals
    WHERE referrer_id = NEW.referrer_id
      AND status = 'accepted';
    
    -- Update all parcels owned by the referrer
    UPDATE parcels
    SET verified_referrals_count = v_referrer_accepted_count
    WHERE user_id = NEW.referrer_id;
    
    -- Update all trips owned by the referrer
    UPDATE trips
    SET verified_referrals_count = v_referrer_accepted_count
    WHERE user_id = NEW.referrer_id;
    
    RAISE NOTICE 'Updated listing visibility for user % with % referrals', NEW.referrer_id, v_referrer_accepted_count;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on referrals table
DROP TRIGGER IF EXISTS trigger_update_listing_visibility ON public.referrals;
CREATE TRIGGER trigger_update_listing_visibility
AFTER INSERT OR UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_user_listing_visibility();

-- Update RLS policies for parcels to respect visibility
DROP POLICY IF EXISTS "Anyone can view open parcels" ON public.parcels;
CREATE POLICY "Anyone can view open parcels"
  ON public.parcels FOR SELECT
  USING (
    -- Owner can always see their own parcels
    auth.uid() = user_id 
    -- Admins can see all
    OR public.has_role(auth.uid(), 'admin')
    -- Public can see if status is open AND listing is visible (enough referrals)
    OR (status = 'open' AND verified_referrals_count >= requires_referrals)
  );

-- Update RLS policies for trips to respect visibility
DROP POLICY IF EXISTS "Anyone can view open trips" ON public.trips;
CREATE POLICY "Anyone can view open trips"
  ON public.trips FOR SELECT
  USING (
    -- Owner can always see their own trips
    auth.uid() = user_id 
    -- Admins can see all
    OR public.has_role(auth.uid(), 'admin')
    -- Public can see if status is open AND listing is visible (enough referrals)
    OR (status = 'open' AND verified_referrals_count >= requires_referrals)
  );

-- Backfill existing listings: set requires_referrals to 0 so they remain visible
-- New listings will have requires_referrals set to 2 by the application code
UPDATE public.parcels 
SET requires_referrals = 0, 
    verified_referrals_count = 0
WHERE requires_referrals IS NULL;

UPDATE public.trips 
SET requires_referrals = 0,
    verified_referrals_count = 0
WHERE requires_referrals IS NULL;

COMMENT ON COLUMN public.parcels.requires_referrals IS 'Number of accepted referrals required before this listing becomes visible to the public';
COMMENT ON COLUMN public.parcels.verified_referrals_count IS 'Current number of accepted referrals the user has completed (auto-updated by trigger)';
COMMENT ON COLUMN public.trips.requires_referrals IS 'Number of accepted referrals required before this listing becomes visible to the public';
COMMENT ON COLUMN public.trips.verified_referrals_count IS 'Current number of accepted referrals the user has completed (auto-updated by trigger)';
