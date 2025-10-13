-- Nettoyer les noms de médicaments qui ont des "/" orphelins
UPDATE public.medications
SET name = TRIM(REGEXP_REPLACE(name, '\s*/\s*$', '', 'g'))
WHERE name ~ '\s*/\s*$';