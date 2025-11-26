-- Migration: Create parcel_matches table
-- Description: Table pour stocker les correspondances entre colis et trajets

-- Create parcel_matches table
CREATE TABLE IF NOT EXISTS public.parcel_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parcel_id, trip_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_parcel_matches_parcel_id ON public.parcel_matches(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_matches_trip_id ON public.parcel_matches(trip_id);
CREATE INDEX IF NOT EXISTS idx_parcel_matches_score ON public.parcel_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_parcel_matches_status ON public.parcel_matches(status);
CREATE INDEX IF NOT EXISTS idx_parcel_matches_created_at ON public.parcel_matches(created_at DESC);

-- Enable RLS
ALTER TABLE public.parcel_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view matches for their own parcels or trips
CREATE POLICY "Users can view matches for their parcels"
ON public.parcel_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parcels p
    WHERE p.id = parcel_matches.parcel_id
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = parcel_matches.trip_id
    AND t.user_id = auth.uid()
  )
);

-- System can insert matches (via triggers)
CREATE POLICY "System can insert matches"
ON public.parcel_matches
FOR INSERT
WITH CHECK (true);

-- Users can update status of matches for their parcels or trips
CREATE POLICY "Users can update their matches"
ON public.parcel_matches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.parcels p
    WHERE p.id = parcel_matches.parcel_id
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = parcel_matches.trip_id
    AND t.user_id = auth.uid()
  )
);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_parcel_matches_updated_at
BEFORE UPDATE ON public.parcel_matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.parcel_matches IS 'Correspondances entre colis et trajets avec score de compatibilité';
COMMENT ON COLUMN public.parcel_matches.match_score IS 'Score de compatibilité de 0 à 100';
COMMENT ON COLUMN public.parcel_matches.status IS 'Statut: pending, accepted, rejected, expired';
