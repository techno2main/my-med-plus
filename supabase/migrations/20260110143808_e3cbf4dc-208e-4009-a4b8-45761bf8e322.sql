-- Correction des medications avec strength manquant (récupération depuis le catalogue)
UPDATE medications m
SET strength = mc.strength
FROM medication_catalog mc
WHERE m.catalog_id = mc.id
  AND m.strength IS NULL
  AND mc.strength IS NOT NULL;