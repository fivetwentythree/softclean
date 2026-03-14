-- ============================================================================
-- CLEANUP: Remove any broken state from migration 016, then notify PostgREST
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- Remove the partially-inserted auth users (if they exist)
DELETE FROM auth.identities WHERE user_id IN (
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'a2000000-0000-0000-0000-000000000002'::uuid
);

DELETE FROM auth.users WHERE id IN (
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'a2000000-0000-0000-0000-000000000002'::uuid
);

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
