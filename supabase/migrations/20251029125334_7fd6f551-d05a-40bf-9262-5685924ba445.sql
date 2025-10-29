-- Create a function to check if user is admin that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'::app_role
  );
$$;