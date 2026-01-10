-- Migration: Add delete_user_account function for GDPR compliance
-- This function allows users to delete their own account and all associated data

-- Drop existing function if exists (to allow parameter rename)
DROP FUNCTION IF EXISTS public.delete_user_account(UUID);

CREATE OR REPLACE FUNCTION public.delete_user_account(p_target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id UUID;
BEGIN
  -- Get the calling user's ID
  calling_user_id := auth.uid();
  
  -- Verify the user is deleting their own account
  IF calling_user_id IS NULL OR calling_user_id != p_target_user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Delete messages sent by user
  DELETE FROM public.messages WHERE sender_id = p_target_user_id;
  
  -- Delete threads where user is participant
  DELETE FROM public.threads 
  WHERE created_by = p_target_user_id OR other_user_id = p_target_user_id;
  
  -- Delete reviews given by user
  DELETE FROM public.reviews WHERE reviewer_id = p_target_user_id;
  
  -- Delete reviews received by user (colonne = target_user_id)
  DELETE FROM public.reviews WHERE target_user_id = p_target_user_id;
  
  -- Delete reservation requests (requester or driver)
  DELETE FROM public.reservation_requests 
  WHERE requester_id = p_target_user_id OR driver_id = p_target_user_id;
  
  -- Delete trips
  DELETE FROM public.trips WHERE user_id = p_target_user_id;
  
  -- Delete parcels
  DELETE FROM public.parcels WHERE user_id = p_target_user_id;
  
  -- Delete favorites
  DELETE FROM public.favorites WHERE user_id = p_target_user_id;
  
  -- Delete flags reported by user
  DELETE FROM public.flags WHERE reporter_id = p_target_user_id;
  
  -- Delete referrals where user is referrer or referred
  DELETE FROM public.referrals 
  WHERE referrer_id = p_target_user_id OR referred_id = p_target_user_id;
  
  -- Delete notification preferences
  DELETE FROM public.notification_preferences WHERE user_id = p_target_user_id;
  
  -- Delete feedbacks (table = feedbacks, not feedback)
  DELETE FROM public.feedbacks WHERE user_id = p_target_user_id;
  
  -- Delete profile (will cascade to related FK references)
  DELETE FROM public.profiles WHERE user_id = p_target_user_id;
  
  -- Finally, delete the auth user
  DELETE FROM auth.users WHERE id = p_target_user_id;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.delete_user_account IS 'GDPR compliant function to delete user account and all associated data. Users can only delete their own account.';
