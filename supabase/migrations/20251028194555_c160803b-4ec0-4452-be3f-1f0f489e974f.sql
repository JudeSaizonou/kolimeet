-- Add indexes for better performance on reviews queries
CREATE INDEX IF NOT EXISTS idx_reviews_target_user_id ON public.reviews(target_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_target ON public.reviews(reviewer_id, target_user_id);

-- Add check constraint for rating bounds (already exists but ensuring it's there)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check 
  CHECK (rating >= 1 AND rating <= 5);