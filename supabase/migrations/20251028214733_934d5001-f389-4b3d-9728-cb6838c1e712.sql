-- Add is_suspended field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Update flags table to add status field if it doesn't exist
ALTER TABLE public.flags 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed'));

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_flags_status ON public.flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_created_at ON public.flags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON public.profiles(is_suspended);

-- Update RLS policies for flags to allow admins to update status
DROP POLICY IF EXISTS "Admins can update flags" ON public.flags;
CREATE POLICY "Admins can update flags"
ON public.flags
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy to prevent suspended users from creating content
DROP POLICY IF EXISTS "Users can create their own parcels" ON public.parcels;
CREATE POLICY "Users can create their own parcels"
ON public.parcels
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_suspended = true
  )
);

DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
CREATE POLICY "Users can create their own trips"
ON public.trips
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_suspended = true
  )
);

DROP POLICY IF EXISTS "Thread members can send messages" ON public.messages;
CREATE POLICY "Thread members can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = messages.thread_id 
    AND (auth.uid() = threads.created_by OR auth.uid() = threads.other_user_id)
  ) AND
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_suspended = true
  )
);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id AND
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_suspended = true
  )
);