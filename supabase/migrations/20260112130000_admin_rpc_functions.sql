-- ============================================================================
-- KOLIMEET ADMIN RPC FUNCTIONS
-- Created: 2026-01-12
-- Description: Core admin functions for user management, moderation, etc.
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Log Admin Action
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action VARCHAR(100),
  p_target_type VARCHAR(50),
  p_target_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_activity_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    inet_client_addr()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER MANAGEMENT FUNCTIONS
-- ============================================================================

-- Ban a user
CREATE OR REPLACE FUNCTION admin_ban_user(
  p_user_id UUID,
  p_reason TEXT,
  p_permanent BOOLEAN DEFAULT false,
  p_duration_days INTEGER DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_admin_id UUID;
  v_ban_until TIMESTAMPTZ;
BEGIN
  v_admin_id := auth.uid();
  
  -- Check admin permissions
  IF NOT has_admin_role('moderator') THEN
    RAISE EXCEPTION 'Unauthorized: requires moderator or super_admin role';
  END IF;
  
  -- Calculate ban duration
  IF p_permanent THEN
    v_ban_until := NULL; -- NULL = permanent
  ELSIF p_duration_days IS NOT NULL THEN
    v_ban_until := NOW() + (p_duration_days || ' days')::INTERVAL;
  ELSE
    v_ban_until := NOW() + INTERVAL '30 days'; -- Default 30 days
  END IF;
  
  -- Update user status
  UPDATE profiles
  SET 
    is_banned = true,
    banned_until = v_ban_until,
    ban_reason = p_reason,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log action
  PERFORM log_admin_action(
    'user.banned',
    'profile',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'permanent', p_permanent,
      'ban_until', v_ban_until,
      'duration_days', p_duration_days
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'banned_until', v_ban_until,
    'message', 'User banned successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend a user temporarily
CREATE OR REPLACE FUNCTION admin_suspend_user(
  p_user_id UUID,
  p_reason TEXT,
  p_duration_days INTEGER DEFAULT 7
)
RETURNS jsonb AS $$
DECLARE
  v_suspend_until TIMESTAMPTZ;
BEGIN
  -- Check admin permissions
  IF NOT has_admin_role('moderator') THEN
    RAISE EXCEPTION 'Unauthorized: requires moderator or super_admin role';
  END IF;
  
  v_suspend_until := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  -- Update user status
  UPDATE profiles
  SET 
    status = 'suspended',
    suspended_until = v_suspend_until,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log action
  PERFORM log_admin_action(
    'user.suspended',
    'profile',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'duration_days', p_duration_days,
      'suspended_until', v_suspend_until
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'suspended_until', v_suspend_until,
    'message', 'User suspended successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unsuspend/Unban a user
CREATE OR REPLACE FUNCTION admin_unsuspend_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
BEGIN
  -- Check admin permissions
  IF NOT has_admin_role('moderator') THEN
    RAISE EXCEPTION 'Unauthorized: requires moderator or super_admin role';
  END IF;
  
  -- Update user status
  UPDATE profiles
  SET 
    status = 'active',
    suspended_until = NULL,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log action
  PERFORM log_admin_action(
    'user.unsuspended',
    'profile',
    p_user_id,
    jsonb_build_object('reason', p_reason)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'message', 'User reinstated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset user trust score
CREATE OR REPLACE FUNCTION admin_reset_trust_score(
  p_user_id UUID,
  p_new_score INTEGER,
  p_reason TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_old_score INTEGER;
BEGIN
  -- Check admin permissions
  IF NOT has_admin_role('moderator') THEN
    RAISE EXCEPTION 'Unauthorized: requires moderator or super_admin role';
  END IF;
  
  -- Validate score range
  IF p_new_score < 0 OR p_new_score > 100 THEN
    RAISE EXCEPTION 'Trust score must be between 0 and 100';
  END IF;
  
  -- Get old score
  SELECT trust_score INTO v_old_score FROM profiles WHERE user_id = p_user_id;
  
  -- Update trust score
  UPDATE profiles
  SET 
    trust_score = p_new_score,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Log action
  PERFORM log_admin_action(
    'user.trust_score_reset',
    'profile',
    p_user_id,
    jsonb_build_object(
      'old_score', v_old_score,
      'new_score', p_new_score,
      'reason', p_reason
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_score', v_old_score,
    'new_score', p_new_score,
    'message', 'Trust score updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FLAG/MODERATION FUNCTIONS
-- ============================================================================

-- Resolve a flag
CREATE OR REPLACE FUNCTION admin_resolve_flag(
  p_flag_id UUID,
  p_action VARCHAR(50), -- 'dismiss', 'warning', 'remove_content', 'suspend_user', 'ban_user'
  p_resolution_notes TEXT,
  p_notify_reporter BOOLEAN DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  v_flag RECORD;
  v_action_result jsonb;
BEGIN
  -- Check admin permissions
  IF NOT has_admin_role('moderator') THEN
    RAISE EXCEPTION 'Unauthorized: requires moderator or super_admin role';
  END IF;
  
  -- Get flag details
  SELECT * INTO v_flag FROM flags WHERE id = p_flag_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flag not found';
  END IF;
  
  -- Update flag status
  UPDATE flags
  SET 
    status = 'resolved',
    resolution = p_action,
    resolution_notes = p_resolution_notes,
    resolved_at = NOW()
  WHERE id = p_flag_id;
  
  -- Execute action based on type
  CASE p_action
    WHEN 'remove_content' THEN
      -- Delete trip or parcel
      IF v_flag.flag_type = 'trip' THEN
        DELETE FROM trips WHERE id = v_flag.flagged_item_id;
        v_action_result := jsonb_build_object('deleted', 'trip');
      ELSIF v_flag.flag_type = 'parcel' THEN
        DELETE FROM parcels WHERE id = v_flag.flagged_item_id;
        v_action_result := jsonb_build_object('deleted', 'parcel');
      END IF;
      
    WHEN 'suspend_user' THEN
      -- Suspend for 7 days
      v_action_result := admin_suspend_user(v_flag.flagged_user_id, p_resolution_notes, 7);
      
    WHEN 'ban_user' THEN
      -- Permanent ban
      v_action_result := admin_ban_user(v_flag.flagged_user_id, p_resolution_notes, true);
      
    ELSE
      -- dismiss or warning: no action
      v_action_result := jsonb_build_object('action', p_action);
  END CASE;
  
  -- Log
  PERFORM log_admin_action(
    'flag.resolved',
    'flag',
    p_flag_id,
    jsonb_build_object(
      'action', p_action,
      'notes', p_resolution_notes,
      'flag_type', v_flag.flag_type,
      'action_result', v_action_result
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'flag_id', p_flag_id,
    'action', p_action,
    'action_result', v_action_result,
    'message', 'Flag resolved successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk resolve flags with same action
CREATE OR REPLACE FUNCTION admin_bulk_resolve_flags(
  p_flag_ids UUID[],
  p_action VARCHAR(50),
  p_resolution_notes TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_flag_id UUID;
  v_resolved_count INTEGER := 0;
  v_errors jsonb[] := '{}';
BEGIN
  -- Check admin permissions
  IF NOT has_admin_role('moderator') THEN
    RAISE EXCEPTION 'Unauthorized: requires moderator or super_admin role';
  END IF;
  
  -- Process each flag
  FOREACH v_flag_id IN ARRAY p_flag_ids LOOP
    BEGIN
      PERFORM admin_resolve_flag(v_flag_id, p_action, p_resolution_notes, false);
      v_resolved_count := v_resolved_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, jsonb_build_object('flag_id', v_flag_id, 'error', SQLERRM));
    END;
  END LOOP;
  
  -- Log bulk action
  PERFORM log_admin_action(
    'flags.bulk_resolved',
    'flag',
    NULL,
    jsonb_build_object(
      'action', p_action,
      'total', array_length(p_flag_ids, 1),
      'resolved', v_resolved_count,
      'errors', v_errors
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'total', array_length(p_flag_ids, 1),
    'resolved', v_resolved_count,
    'errors', v_errors,
    'message', v_resolved_count || ' flags resolved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONTENT MANAGEMENT FUNCTIONS
-- ============================================================================

-- Delete content (trip or parcel)
CREATE OR REPLACE FUNCTION admin_delete_content(
  p_content_type VARCHAR(20), -- 'trip' or 'parcel'
  p_content_id UUID,
  p_reason TEXT
)
RETURNS jsonb AS $$
BEGIN
  -- Check admin permissions
  IF NOT has_admin_role('moderator') THEN
    RAISE EXCEPTION 'Unauthorized: requires moderator or super_admin role';
  END IF;
  
  -- Delete content
  IF p_content_type = 'trip' THEN
    DELETE FROM trips WHERE id = p_content_id;
  ELSIF p_content_type = 'parcel' THEN
    DELETE FROM parcels WHERE id = p_content_id;
  ELSE
    RAISE EXCEPTION 'Invalid content type';
  END IF;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content not found';
  END IF;
  
  -- Log action
  PERFORM log_admin_action(
    'content.deleted',
    p_content_type,
    p_content_id,
    jsonb_build_object('reason', p_reason)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'content_type', p_content_type,
    'content_id', p_content_id,
    'message', 'Content deleted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SETTINGS MANAGEMENT
-- ============================================================================

-- Update platform settings
CREATE OR REPLACE FUNCTION admin_update_settings(
  p_key VARCHAR(100),
  p_value JSONB
)
RETURNS jsonb AS $$
BEGIN
  -- Check admin permissions
  IF NOT has_admin_role('super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: requires super_admin role';
  END IF;
  
  -- Update or insert setting
  INSERT INTO platform_settings (key, value, updated_by)
  VALUES (p_key, p_value, auth.uid())
  ON CONFLICT (key) DO UPDATE
  SET 
    value = EXCLUDED.value,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();
  
  -- Log action
  PERFORM log_admin_action(
    'settings.updated',
    'platform_settings',
    NULL,
    jsonb_build_object('key', p_key, 'value', p_value)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'key', p_key,
    'message', 'Settings updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUPPORT TICKET FUNCTIONS
-- ============================================================================

-- Assign ticket to admin
CREATE OR REPLACE FUNCTION admin_assign_ticket(
  p_ticket_id UUID,
  p_admin_id UUID
)
RETURNS jsonb AS $$
BEGIN
  -- Check admin permissions
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  
  -- Verify admin exists
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_admin_id AND is_active = true) THEN
    RAISE EXCEPTION 'Invalid admin user';
  END IF;
  
  -- Assign ticket
  UPDATE support_tickets
  SET 
    assigned_to = p_admin_id,
    status = CASE WHEN status = 'new' THEN 'open' ELSE status END,
    updated_at = NOW()
  WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  
  -- Log action
  PERFORM log_admin_action(
    'ticket.assigned',
    'support_ticket',
    p_ticket_id,
    jsonb_build_object('assigned_to', p_admin_id)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', p_ticket_id,
    'assigned_to', p_admin_id,
    'message', 'Ticket assigned successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve support ticket
CREATE OR REPLACE FUNCTION admin_resolve_ticket(
  p_ticket_id UUID,
  p_resolution_message TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
BEGIN
  -- Check admin permissions
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;
  
  -- Add resolution message if provided
  IF p_resolution_message IS NOT NULL THEN
    INSERT INTO support_messages (ticket_id, sender_id, sender_type, message)
    VALUES (p_ticket_id, auth.uid(), 'admin', p_resolution_message);
  END IF;
  
  -- Update ticket status
  UPDATE support_tickets
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  
  -- Log action
  PERFORM log_admin_action(
    'ticket.resolved',
    'support_ticket',
    p_ticket_id,
    jsonb_build_object('has_message', p_resolution_message IS NOT NULL)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', p_ticket_id,
    'message', 'Ticket resolved successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users (will be filtered by RLS)
GRANT EXECUTE ON FUNCTION admin_ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_suspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unsuspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_trust_score TO authenticated;
GRANT EXECUTE ON FUNCTION admin_resolve_flag TO authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_resolve_flags TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_content TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_settings TO authenticated;
GRANT EXECUTE ON FUNCTION admin_assign_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION admin_resolve_ticket TO authenticated;
