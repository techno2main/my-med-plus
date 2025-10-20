-- =====================================================
-- Script : Split address into postal_code and city
-- Date : 20 octobre 2025
-- Table : health_professionals
-- Description : Ajouter les champs postal_code et city,
--               extraire les données depuis address,
--               puis renommer address en street_address
-- =====================================================

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE health_professionals
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100);

COMMENT ON COLUMN health_professionals.postal_code IS 'Code postal extrait de l''adresse';
COMMENT ON COLUMN health_professionals.city IS 'Ville extraite de l''adresse';

-- 2. Extraire postal_code et city depuis address
-- Format attendu: "Rue..., CP Ville" ou "Rue..., CP, Ville"
UPDATE health_professionals
SET 
  postal_code = CASE
    -- Extraire le code postal (5 chiffres après la dernière virgule)
    WHEN address ~ ',\s*\d{5}\s+' THEN 
      TRIM(REGEXP_REPLACE(
        SUBSTRING(address FROM ',\s*(\d{5})\s+[^,]+$'),
        '[^0-9]', '', 'g'
      ))
    ELSE NULL
  END,
  city = CASE
    -- Extraire la ville (texte après le code postal)
    WHEN address ~ ',\s*\d{5}\s+' THEN 
      TRIM(REGEXP_REPLACE(
        address,
        '^.*,\s*\d{5}\s+(.+)$',
        '\1'
      ))
    ELSE NULL
  END
WHERE address IS NOT NULL
  AND address != '';

-- 3. Vérification des extractions
DO $$
DECLARE
  total_count INTEGER;
  extracted_count INTEGER;
  failed_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM health_professionals
  WHERE address IS NOT NULL AND address != '';
  
  SELECT COUNT(*) INTO extracted_count
  FROM health_professionals
  WHERE postal_code IS NOT NULL AND city IS NOT NULL;
  
  failed_count := total_count - extracted_count;
  
  RAISE NOTICE '=== RÉSULTATS EXTRACTION ===';
  RAISE NOTICE 'Total adresses: %', total_count;
  RAISE NOTICE 'Extractions réussies: %', extracted_count;
  RAISE NOTICE 'Extractions échouées: %', failed_count;
  
  IF failed_count > 0 THEN
    RAISE NOTICE 'Adresses problématiques:';
    FOR rec IN 
      SELECT id, name, address 
      FROM health_professionals 
      WHERE (postal_code IS NULL OR city IS NULL)
        AND address IS NOT NULL 
        AND address != ''
    LOOP
      RAISE NOTICE '  - % (%) : %', rec.name, rec.id, rec.address;
    END LOOP;
  END IF;
END $$;

-- 4. Mettre à jour address pour ne garder que la rue
-- Supprimer ", CP Ville" à la fin
UPDATE health_professionals
SET address = TRIM(REGEXP_REPLACE(address, ',\s*\d{5}\s+[^,]+$', ''))
WHERE address IS NOT NULL
  AND address != ''
  AND postal_code IS NOT NULL;

-- 5. Renommer la colonne address en street_address pour plus de clarté
ALTER TABLE health_professionals
  RENAME COLUMN address TO street_address;

COMMENT ON COLUMN health_professionals.street_address IS 'Adresse de rue (numéro et nom de rue)';

-- 6. Ajouter des contraintes
ALTER TABLE health_professionals
  ADD CONSTRAINT chk_postal_code_format 
    CHECK (postal_code IS NULL OR postal_code ~ '^\d{5}$'),
  ADD CONSTRAINT chk_city_length 
    CHECK (city IS NULL OR LENGTH(city) >= 2);

-- 7. Créer un index pour les recherches par ville/code postal
CREATE INDEX IF NOT EXISTS idx_health_professionals_location 
  ON health_professionals(postal_code, city);

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================
SELECT 
  id,
  name,
  type,
  street_address,
  postal_code,
  city,
  street_address || ', ' || postal_code || ' ' || city AS full_address
FROM health_professionals
ORDER BY type, name;

-- =====================================================
-- ROLLBACK (si nécessaire)
-- =====================================================
-- Pour revenir en arrière:
-- ALTER TABLE health_professionals DROP CONSTRAINT IF EXISTS chk_postal_code_format;
-- ALTER TABLE health_professionals DROP CONSTRAINT IF EXISTS chk_city_length;
-- DROP INDEX IF EXISTS idx_health_professionals_location;
-- ALTER TABLE health_professionals RENAME COLUMN street_address TO address;
-- ALTER TABLE health_professionals DROP COLUMN IF EXISTS postal_code;
-- ALTER TABLE health_professionals DROP COLUMN IF EXISTS city;
