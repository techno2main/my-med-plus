-- Correction de sécurité : utiliser SECURITY INVOKER pour respecter les policies RLS
DROP VIEW IF EXISTS public.medication_intakes_details;

CREATE VIEW public.medication_intakes_details
WITH (security_invoker = true)
AS
SELECT 
  mi.id,
  mi.scheduled_time,
  mi.status,
  mi.taken_at,
  mi.notes,
  mi.created_at,
  mi.updated_at,
  mi.medication_id,
  m.name AS medication_name,
  m.posology,
  m.strength AS medication_strength,
  m.is_paused AS medication_is_paused,
  t.id AS treatment_id,
  t.name AS treatment_name,
  t.pathology,
  t.is_active AS treatment_is_active,
  t.user_id
FROM public.medication_intakes mi
JOIN public.medications m ON mi.medication_id = m.id
JOIN public.treatments t ON m.treatment_id = t.id;