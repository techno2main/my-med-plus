-- =====================================================
-- FIX: Reassign pathology to correct user
-- Date: 3 novembre 2025
-- =====================================================

-- Reassign "Test Pathologie 1" to the user who created it
UPDATE public.pathologies 
SET created_by = 'ffa0901c-a531-4772-9bec-f4d3b48ab926'
WHERE id = '8d38a526-8f02-4241-9b59-d2db6ff9ef23';