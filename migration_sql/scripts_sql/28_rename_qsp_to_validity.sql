-- Migration 28 : Clarification de la terminologie QSP
-- Date : 27 octobre 2025
-- Objectif : Séparer "Validité ordonnance" et "Stock médicament"

-- ============================================
-- ÉTAPE 1 : Ajouter validity_months sur prescriptions
-- ============================================

ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS validity_months INTEGER DEFAULT 3;

COMMENT ON COLUMN prescriptions.validity_months IS 
  'Durée de validité de l''ordonnance en mois (1, 3, 6, 12). Détermine la date de renouvellement 2/3.';

-- Migrer les données existantes depuis treatments.qsp_days
UPDATE prescriptions p
SET validity_months = CASE
  WHEN t.qsp_days IS NULL THEN 3 -- Par défaut : 3 mois
  WHEN t.qsp_days <= 30 THEN 1
  WHEN t.qsp_days <= 90 THEN 3
  WHEN t.qsp_days <= 180 THEN 6
  ELSE 12
END
FROM treatments t
WHERE t.prescription_id = p.id
  AND p.validity_months = 3; -- Mettre à jour uniquement les valeurs par défaut

-- ============================================
-- ÉTAPE 2 : Ajouter initial_stock sur medications
-- ============================================

ALTER TABLE medications
ADD COLUMN IF NOT EXISTS initial_stock INTEGER,
ADD COLUMN IF NOT EXISTS unit_per_box INTEGER;

COMMENT ON COLUMN medications.initial_stock IS 
  'Stock initial reçu lors de la première visite pharmacie (en unités).';

COMMENT ON COLUMN medications.unit_per_box IS 
  'Nombre d''unités par conditionnement (ex: 28, 30, 60 comprimés par boîte).';

-- Migrer current_stock vers initial_stock pour les médicaments existants
UPDATE medications
SET initial_stock = current_stock
WHERE initial_stock IS NULL
  AND current_stock IS NOT NULL
  AND current_stock > 0;

-- ============================================
-- ÉTAPE 3 : Marquer qsp_days comme DEPRECATED sur treatments
-- ============================================

-- Ne pas supprimer pour compatibilité ascendante
COMMENT ON COLUMN treatments.qsp_days IS 
  'DEPRECATED - Utiliser prescriptions.validity_months à la place. Cette colonne sera supprimée dans une future version.';

-- ============================================
-- ÉTAPE 4 : Fonction helper pour calculer les jours restants
-- ============================================

CREATE OR REPLACE FUNCTION calculate_days_until_empty(
  stock INTEGER,
  daily_consumption INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  IF stock IS NULL OR daily_consumption IS NULL OR daily_consumption = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN FLOOR(stock::NUMERIC / daily_consumption);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_days_until_empty IS 
  'Calcule le nombre de jours avant épuisement du stock d''un médicament.';

-- ============================================
-- VALIDATION
-- ============================================

-- Vérifier que toutes les prescriptions ont une validity_months
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM prescriptions
  WHERE validity_months IS NULL;
  
  IF missing_count > 0 THEN
    RAISE WARNING '% prescriptions sans validity_months détectées', missing_count;
  ELSE
    RAISE NOTICE 'Migration réussie : toutes les prescriptions ont une validity_months';
  END IF;
END $$;
