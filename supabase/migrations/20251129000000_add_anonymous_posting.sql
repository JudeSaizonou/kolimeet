-- Migration: Add anonymous posting feature
-- Date: 2025-11-29

-- Add is_anonymous column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Add is_anonymous column to parcels table
ALTER TABLE parcels ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Add default_anonymous_posting preference to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_anonymous_posting BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN trips.is_anonymous IS 'If true, the user profile info will be hidden in the listing';
COMMENT ON COLUMN parcels.is_anonymous IS 'If true, the user profile info will be hidden in the listing';
COMMENT ON COLUMN profiles.default_anonymous_posting IS 'Default preference for anonymous posting when creating new listings';
