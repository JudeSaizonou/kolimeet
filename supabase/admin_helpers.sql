-- ============================================================================
-- KOLIMEET ADMIN HELPER SCRIPT
-- Description: Scripts helper pour gérer les admins facilement
-- ============================================================================

-- ============================================================================
-- 1. CREATE ADMIN USER
-- ============================================================================
-- Remplacez 'user@example.com' par l'email de l'utilisateur que vous voulez promouvoir admin
-- Remplacez 'super_admin' par le rôle souhaité: 'super_admin', 'moderator', 'support', ou 'analyst'

-- Pour créer un super admin:
INSERT INTO admin_users (user_id, role, is_active, permissions)
SELECT 
  id,
  'super_admin'::admin_role,
  true,
  '{
    "users": ["view", "edit", "ban", "delete"],
    "content": ["view", "edit", "delete"],
    "flags": ["view", "resolve"],
    "analytics": ["view"],
    "settings": ["edit"]
  }'::jsonb
FROM auth.users
WHERE email = 'user@example.com' -- 🔧 REMPLACER PAR L'EMAIL
LIMIT 1
ON CONFLICT (user_id) DO UPDATE
SET 
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- ============================================================================
-- 2. CREATE MODERATOR
-- ============================================================================
INSERT INTO admin_users (user_id, role, is_active, permissions)
SELECT 
  id,
  'moderator'::admin_role,
  true,
  '{
    "users": ["view", "ban"],
    "content": ["view", "delete"],
    "flags": ["view", "resolve"],
    "analytics": ["view"],
    "settings": []
  }'::jsonb
FROM auth.users
WHERE email = 'moderator@example.com' -- 🔧 REMPLACER PAR L'EMAIL
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 3. CREATE SUPPORT AGENT
-- ============================================================================
INSERT INTO admin_users (user_id, role, is_active, permissions)
SELECT 
  id,
  'support'::admin_role,
  true,
  '{
    "users": ["view"],
    "content": ["view"],
    "flags": ["view"],
    "analytics": ["view"],
    "settings": []
  }'::jsonb
FROM auth.users
WHERE email = 'support@example.com' -- 🔧 REMPLACER PAR L'EMAIL
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 4. CREATE ANALYST
-- ============================================================================
INSERT INTO admin_users (user_id, role, is_active, permissions)
SELECT 
  id,
  'analyst'::admin_role,
  true,
  '{
    "users": [],
    "content": [],
    "flags": [],
    "analytics": ["view"],
    "settings": []
  }'::jsonb
FROM auth.users
WHERE email = 'analyst@example.com' -- 🔧 REMPLACER PAR L'EMAIL
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 5. LIST ALL ADMINS
-- ============================================================================
SELECT 
  au.id,
  au.user_id,
  u.email,
  p.full_name,
  au.role,
  au.is_active,
  au.last_login,
  au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN profiles p ON p.user_id = au.user_id
ORDER BY au.created_at DESC;

-- ============================================================================
-- 6. DEACTIVATE ADMIN
-- ============================================================================
UPDATE admin_users
SET is_active = false, updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1
);

-- ============================================================================
-- 7. REACTIVATE ADMIN
-- ============================================================================
UPDATE admin_users
SET is_active = true, updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1
);

-- ============================================================================
-- 8. DELETE ADMIN (SOFT - deactivate only)
-- ============================================================================
UPDATE admin_users
SET is_active = false, updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1
);

-- ============================================================================
-- 9. DELETE ADMIN (HARD - permanent)
-- ============================================================================
DELETE FROM admin_users
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1
);

-- ============================================================================
-- 10. PROMOTE USER TO SUPER ADMIN (Quick command)
-- ============================================================================
-- Usage: Change email and run
INSERT INTO admin_users (user_id, role, is_active)
SELECT id, 'super_admin'::admin_role, true
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', is_active = true;

-- ============================================================================
-- 11. CHECK IF USER IS ADMIN
-- ============================================================================
SELECT 
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com' LIMIT 1)
    AND is_active = true
  ) as is_admin;

-- ============================================================================
-- 12. GET ADMIN ACTIVITY (Last 50 actions)
-- ============================================================================
SELECT 
  aal.created_at,
  u.email as admin_email,
  p.full_name as admin_name,
  aal.action,
  aal.target_type,
  aal.details
FROM admin_activity_logs aal
JOIN auth.users u ON u.id = aal.admin_id
LEFT JOIN profiles p ON p.user_id = aal.admin_id
ORDER BY aal.created_at DESC
LIMIT 50;

-- ============================================================================
-- EXAMPLES FOR TESTING
-- ============================================================================

-- Create a test super admin (replace with your actual email)
/*
INSERT INTO admin_users (user_id, role, is_active, permissions)
SELECT 
  id,
  'super_admin'::admin_role,
  true,
  '{
    "users": ["view", "edit", "ban", "delete"],
    "content": ["view", "edit", "delete"],
    "flags": ["view", "resolve"],
    "analytics": ["view"],
    "settings": ["edit"]
  }'::jsonb
FROM auth.users
WHERE email = 'your-real-email@gmail.com'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE
SET 
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();
*/

-- Test: Check admin dashboard stats
/*
SELECT * FROM admin_dashboard_stats;
*/

-- Test: Ban a user (as admin)
/*
SELECT admin_ban_user(
  'user-uuid-here'::uuid,
  'Test ban - violating terms',
  false,
  7
);
*/

-- Test: Resolve a flag
/*
SELECT admin_resolve_flag(
  'flag-uuid-here'::uuid,
  'dismiss',
  'False alarm - no violation found',
  true
);
*/
