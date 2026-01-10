-- =====================================================
-- CRITICAL SECURITY FIX: Add RLS to medication_intakes_details view
-- =====================================================

-- Enable RLS on the medication_intakes_details view
ALTER VIEW medication_intakes_details SET (security_invoker = on);

-- Note: Views with security_invoker inherit RLS from underlying tables
-- The view references:
-- - medication_intakes -> medications -> treatments (has user_id RLS)
-- So queries will automatically be filtered by the authenticated user's access