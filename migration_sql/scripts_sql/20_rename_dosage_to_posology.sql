-- =====================================================
-- MIGRATION 20: Renommage complet pour cohérence sémantique
-- Date: 20 octobre 2025
-- Objectif: Clarifier la sémantique des champs
--   - POSOLOGIE (posology) = Instructions de prise ("1 comprimé le matin")
--   - FORCE (strength) = Concentration du médicament ("50mg", "1g")
-- =====================================================

-- ⚠️  INSTRUCTIONS D'EXÉCUTION MANUELLE :
-- 1. Copier ce script COMPLET
-- 2. Ouvrir l'éditeur SQL de Supabase
-- 3. Coller et exécuter MANUELLEMENT ligne par ligne ou par bloc
-- 4. Vérifier les résultats de chaque étape
-- 5. Mettre à jour les fichiers TypeScript (voir liste ci-dessous)

-- =====================================================
-- ÉTAPE 1: Renommer les colonnes dans medication_catalog
-- =====================================================

-- 1.1 default_dosage → default_posology (instructions de prise par défaut)
ALTER TABLE public.medication_catalog 
RENAME COLUMN default_dosage TO default_posology;

-- 1.2 dosage_amount → strength (force du médicament)
ALTER TABLE public.medication_catalog 
RENAME COLUMN dosage_amount TO strength;

-- =====================================================
-- ÉTAPE 2: Renommer les colonnes dans medications
-- =====================================================

-- 2.1 dosage → posology (instructions de prise)
ALTER TABLE public.medications 
RENAME COLUMN dosage TO posology;

-- 2.2 dosage_amount → strength (force du médicament)
ALTER TABLE public.medications 
RENAME COLUMN dosage_amount TO strength;

-- =====================================================
-- ÉTAPE 3: Ajouter des commentaires explicatifs
-- =====================================================

-- Commentaires pour medication_catalog
COMMENT ON COLUMN public.medication_catalog.default_posology IS 
'Posologie par défaut (instructions de prise, ex: "1 comprimé le matin et 1 le soir"). 
À ne pas confondre avec strength qui indique la force/concentration du médicament.';

COMMENT ON COLUMN public.medication_catalog.strength IS 
'Force/concentration du médicament (ex: "50mg", "1g", "5mg/1000mg"). 
À ne pas confondre avec default_posology qui indique les instructions de prise.';

-- Commentaires pour medications
COMMENT ON COLUMN public.medications.posology IS 
'Posologie (instructions de prise pour ce traitement, ex: "1 comprimé le matin et 1 le soir"). 
À ne pas confondre avec strength qui indique la force du médicament.';

COMMENT ON COLUMN public.medications.strength IS 
'Force/concentration du médicament (ex: "50mg", "1g", "5mg/1000mg"). 
À ne pas confondre avec posology qui indique les instructions de prise.';

-- =====================================================
-- VÉRIFICATIONS
-- =====================================================

-- Vérifier medication_catalog
SELECT column_name, data_type, col_description('public.medication_catalog'::regclass, ordinal_position)
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'medication_catalog' 
  AND column_name IN ('default_posology', 'strength')
ORDER BY column_name;

-- Devrait retourner:
-- default_posology | text | Posologie par défaut...
-- strength         | text | Force/concentration...

-- Vérifier medications
SELECT column_name, data_type, col_description('public.medications'::regclass, ordinal_position)
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'medications' 
  AND column_name IN ('posology', 'strength')
ORDER BY column_name;

-- Devrait retourner:
-- posology | text | Posologie (instructions...
-- strength | text | Force/concentration...

-- =====================================================
-- FICHIERS TYPESCRIPT À METTRE À JOUR APRÈS EXÉCUTION
-- =====================================================
-- 
-- ✅ TOTAL: 13 fichiers à modifier
--
-- 1. src/integrations/supabase/types.ts
--    medication_catalog: default_dosage → default_posology, dosage_amount → strength
--    medications: dosage_amount → strength
--
-- 2. src/pages/MedicationCatalog.tsx
--    Toutes les occurrences: default_dosage → default_posology, dosage_amount → strength
--    Labels UI: "Dosage" → "Force" pour le champ strength
--
-- 3. src/pages/Treatments.tsx
--    .select("pathology, strength, default_posology")
--    catalogData?.strength || catalogData?.default_posology
--
-- 4. src/pages/TreatmentEdit.tsx
--    dosage_amount → strength (type + queries)
--
-- 5. src/pages/StockForm.tsx
--    medication_catalog(strength, default_posology)
--
-- 6. src/pages/Stock.tsx
--    medication_catalog(strength, default_posology)
--
-- 7. src/pages/Index.tsx
--    medication_catalog(pathology, strength, default_posology)
--
-- 8. src/pages/History.tsx
--    medication_catalog(strength, default_posology)
--
-- 9. src/pages/Calendar.tsx
--    medication_catalog(strength, default_posology)
--
-- 10. src/components/TreatmentWizard/types.ts
--     default_dosage → default_posology, dosage_amount → strength
--
-- 11. src/components/TreatmentWizard/TreatmentWizard.tsx
--     dosage_amount → strength
--
-- 12. src/components/TreatmentWizard/Step2Medications.tsx
--     default_dosage → default_posology, dosage_amount → strength
--
-- 13. src/hooks/useMissedIntakesDetection.tsx
--     medication_catalog(strength, default_posology)

-- =====================================================
-- ROLLBACK (en cas de problème)
-- =====================================================
-- Si vous devez annuler cette migration :
/*
ALTER TABLE public.medication_catalog 
RENAME COLUMN default_posology TO default_dosage;

ALTER TABLE public.medication_catalog 
RENAME COLUMN strength TO dosage_amount;

ALTER TABLE public.medications 
RENAME COLUMN posology TO dosage;

ALTER TABLE public.medications 
RENAME COLUMN strength TO dosage_amount;
*/
