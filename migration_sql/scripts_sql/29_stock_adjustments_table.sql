-- Migration 29 : Table d'historique des ajustements de stock
-- Date : 27 octobre 2025
-- Objectif : Tracer tous les changements de stock (visites pharmacie, ajustements manuels)

-- ============================================
-- Création de la table stock_adjustments
-- ============================================

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  
  -- Stocks
  old_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  difference INTEGER GENERATED ALWAYS AS (new_stock - old_stock) STORED,
  
  -- Type d'ajustement
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('pharmacy_visit', 'manual_correction', 'initial_stock', 'consumption_update')),
  
  -- Informations complémentaires
  reason TEXT,
  pharmacy_visit_id UUID REFERENCES pharmacy_visits(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_medication 
ON stock_adjustments(medication_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_visit 
ON stock_adjustments(pharmacy_visit_id) 
WHERE pharmacy_visit_id IS NOT NULL;

-- Commentaires
COMMENT ON TABLE stock_adjustments IS 
  'Historique de tous les ajustements de stock des médicaments (visites pharmacie, corrections manuelles).';

COMMENT ON COLUMN stock_adjustments.adjustment_type IS 
  'Type d''ajustement :
  - pharmacy_visit : Réapprovisionnement en pharmacie
  - manual_correction : Correction manuelle par l''utilisateur
  - initial_stock : Stock initial lors de la création du traitement
  - consumption_update : Ajustement automatique après prise';

-- ============================================
-- Trigger pour enregistrer automatiquement les changements
-- ============================================

CREATE OR REPLACE FUNCTION log_stock_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  -- Enregistrer uniquement si le stock a changé
  IF OLD.current_stock IS DISTINCT FROM NEW.current_stock THEN
    INSERT INTO stock_adjustments (
      medication_id,
      old_stock,
      new_stock,
      adjustment_type,
      reason
    ) VALUES (
      NEW.id,
      COALESCE(OLD.current_stock, 0),
      COALESCE(NEW.current_stock, 0),
      'manual_correction', -- Par défaut, sauf si déclenché par un autre trigger
      'Modification automatique'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger (désactivé par défaut pour éviter les doublons)
-- Il sera activé après la Phase 2
-- CREATE TRIGGER trigger_log_stock_adjustment
--   AFTER UPDATE OF current_stock ON medications
--   FOR EACH ROW
--   EXECUTE FUNCTION log_stock_adjustment();

-- ============================================
-- Fonction helper pour ajouter du stock (visite pharmacie)
-- ============================================

CREATE OR REPLACE FUNCTION add_stock_from_pharmacy_visit(
  med_id UUID,
  boxes INTEGER,
  units_per_box INTEGER,
  visit_id UUID DEFAULT NULL,
  visit_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  old_stock INTEGER;
  new_stock INTEGER;
  adjustment_id UUID;
BEGIN
  -- Récupérer le stock actuel
  SELECT current_stock INTO old_stock
  FROM medications
  WHERE id = med_id;
  
  -- Calculer le nouveau stock
  new_stock := COALESCE(old_stock, 0) + (boxes * units_per_box);
  
  -- Mettre à jour le médicament
  UPDATE medications
  SET 
    current_stock = new_stock,
    unit_per_box = units_per_box,
    updated_at = NOW()
  WHERE id = med_id;
  
  -- Enregistrer l'ajustement
  INSERT INTO stock_adjustments (
    medication_id,
    old_stock,
    new_stock,
    adjustment_type,
    reason,
    pharmacy_visit_id
  ) VALUES (
    med_id,
    COALESCE(old_stock, 0),
    new_stock,
    'pharmacy_visit',
    format('Réapprovisionnement : %s boîte(s) de %s unités', boxes, units_per_box),
    visit_id
  )
  RETURNING id INTO adjustment_id;
  
  -- Retourner le résultat
  RETURN jsonb_build_object(
    'success', true,
    'old_stock', old_stock,
    'new_stock', new_stock,
    'added', boxes * units_per_box,
    'adjustment_id', adjustment_id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_stock_from_pharmacy_visit IS 
  'Ajoute du stock suite à une visite pharmacie et enregistre l''historique.';

-- ============================================
-- VALIDATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Table stock_adjustments créée avec succès';
  RAISE NOTICE 'Fonction add_stock_from_pharmacy_visit disponible';
END $$;
