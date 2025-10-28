-- Fix conflicting storage policies on parcels bucket
-- Remove the restrictive policy since open parcels are meant to be publicly viewable
-- and the "Anyone can view parcel photos" policy makes photos accessible for browsing

DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;

-- Keep the public viewing policy for parcel photos
-- This aligns with the business logic where open parcels are publicly browsable