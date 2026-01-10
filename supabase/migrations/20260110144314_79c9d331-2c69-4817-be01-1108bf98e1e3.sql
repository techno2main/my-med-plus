-- Réorganisation de la vue : status avant notes + tri par défaut descending
DROP VIEW IF EXISTS public.medication_intakes_details;

CREATE VIEW public.medication_intakes_details
WITH (security_invoker = true)
AS
SELECT 
  mi.id,
  t.name AS treatment_name,
  mi.scheduled_time,
  m.name AS medication_name,
  m.strength AS medication_strength,
  mi.taken_at,
  mi.status,
  mi.notes,
  m.posology,
  mi.medication_id,
  t.pathology,
  t.id AS treatment_id,
  t.is_active AS treatment_is_active,
  t.user_id,
  mi.created_at,
  mi.updated_at,
  m.is_paused AS medication_is_paused
FROM public.medication_intakes mi
JOIN public.medications m ON mi.medication_id = m.id
JOIN public.treatments t ON m.treatment_id = t.id
ORDER BY mi.scheduled_time DESC;