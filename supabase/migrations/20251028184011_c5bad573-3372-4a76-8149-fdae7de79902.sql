-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trips table (Voyageurs)
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  from_country TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_country TEXT NOT NULL,
  to_city TEXT NOT NULL,
  date_departure DATE NOT NULL,
  capacity_liters INTEGER NOT NULL CHECK (capacity_liters > 0),
  capacity_available_liters INTEGER NOT NULL CHECK (capacity_available_liters >= 0),
  price_expect NUMERIC CHECK (price_expect >= 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Index for trips search
CREATE INDEX idx_trips_route_date ON public.trips(from_country, from_city, to_country, to_city, date_departure);
CREATE INDEX idx_trips_user ON public.trips(user_id);
CREATE INDEX idx_trips_status ON public.trips(status);

-- RLS policies for trips
CREATE POLICY "Anyone can view open trips"
  ON public.trips FOR SELECT
  USING (status = 'open' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create parcels table (Expéditeurs)
CREATE TABLE public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('documents', 'vetements', 'electronique', 'autre')),
  weight_kg NUMERIC NOT NULL CHECK (weight_kg > 0),
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L')),
  from_country TEXT NOT NULL,
  from_city TEXT NOT NULL,
  to_country TEXT NOT NULL,
  to_city TEXT NOT NULL,
  deadline DATE NOT NULL,
  description TEXT,
  photos TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Index for parcels search
CREATE INDEX idx_parcels_route_deadline ON public.parcels(from_country, from_city, to_country, to_city, deadline);
CREATE INDEX idx_parcels_user ON public.parcels(user_id);
CREATE INDEX idx_parcels_status ON public.parcels(status);

-- RLS policies for parcels
CREATE POLICY "Anyone can view open parcels"
  ON public.parcels FOR SELECT
  USING (status = 'open' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own parcels"
  ON public.parcels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parcels"
  ON public.parcels FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own parcels"
  ON public.parcels FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Create threads table (conversations)
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  related_type TEXT NOT NULL CHECK (related_type IN ('trip', 'parcel')),
  related_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (created_by != other_user_id)
);

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_threads_users ON public.threads(created_by, other_user_id);
CREATE INDEX idx_threads_related ON public.threads(related_type, related_id);

-- RLS policies for threads
CREATE POLICY "Users can view their own threads"
  ON public.threads FOR SELECT
  USING (auth.uid() IN (created_by, other_user_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create threads"
  ON public.threads FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Thread members can update"
  ON public.threads FOR UPDATE
  USING (auth.uid() IN (created_by, other_user_id) OR public.has_role(auth.uid(), 'admin'));

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at DESC);

-- RLS policies for messages
CREATE POLICY "Thread members can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.threads
      WHERE threads.id = messages.thread_id
        AND (auth.uid() IN (threads.created_by, threads.other_user_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Thread members can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.threads
      WHERE threads.id = thread_id
        AND auth.uid() IN (threads.created_by, threads.other_user_id)
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id OR public.has_role(auth.uid(), 'admin'));

-- Create reviews table (avis)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reviewer_id != target_user_id),
  UNIQUE (reviewer_id, target_user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reviews_target ON public.reviews(target_user_id);

-- RLS policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger to update profile rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
BEGIN
  -- Get target_user_id from NEW or OLD
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.target_user_id;
  ELSE
    target_id := NEW.target_user_id;
  END IF;

  -- Update profile rating stats
  UPDATE public.profiles
  SET 
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM public.reviews
      WHERE target_user_id = target_id
    ), 0),
    rating_count = COALESCE((
      SELECT COUNT(*)
      FROM public.reviews
      WHERE target_user_id = target_id
    ), 0)
  WHERE user_id = target_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_rating();

-- Create flags table (modération)
CREATE TABLE public.flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('trip', 'parcel', 'message', 'profile')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_flags_entity ON public.flags(entity_type, entity_id);

-- RLS policies for flags
CREATE POLICY "Users can create flags"
  ON public.flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only admins can view flags"
  ON public.flags FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete flags"
  ON public.flags FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('parcels', 'parcels', false, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for parcels bucket
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'parcels' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'parcels' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view parcel photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'parcels');

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'parcels' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );