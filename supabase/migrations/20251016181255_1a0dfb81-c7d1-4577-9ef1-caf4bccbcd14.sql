-- Mettre à jour la visite initiale avec la bonne date et marquer comme complétée
UPDATE pharmacy_visits
SET 
  actual_visit_date = '2025-10-07',
  is_completed = true
WHERE id = 'b85cbc59-be91-4d49-bf88-360aea84c024';