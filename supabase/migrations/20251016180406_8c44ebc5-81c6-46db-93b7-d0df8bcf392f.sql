-- Corriger la date réelle du premier rechargement (Initial 1/3) pour qu'elle soit le 07/10/2025
UPDATE pharmacy_visits
SET actual_visit_date = '2025-10-07'
WHERE id = 'b85cbc59-be91-4d49-bf88-360aea84c024';