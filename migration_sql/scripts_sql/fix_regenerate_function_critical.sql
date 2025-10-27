-- CORRECTION CRITIQUE : La fonction supprimait les prises d'aujourd'hui !
-- Problème : DELETE supprimait TOUTES les prises pending, puis régénérait à partir de DEMAIN
-- Solution : Ne supprimer QUE les prises futures (> aujourd'hui) et régénérer à partir d'AUJOURD'HUI

CREATE OR REPLACE FUNCTION regenerate_future_intakes(med_id UUID)
RETURNS void AS $$
DECLARE
  md RECORD;
  intake_date DATE;
  time_value TEXT;
BEGIN
  -- Récupérer les infos du médicament
  SELECT times INTO md
  FROM medications
  WHERE id = med_id;

  -- Vérifier que times n'est pas vide
  IF md.times IS NULL OR array_length(md.times, 1) = 0 THEN
    RETURN;
  END IF;

  -- ⚠️ CORRECTION : Supprimer uniquement les prises FUTURES (après aujourd'hui)
  -- Ne PAS toucher aux prises d'aujourd'hui !
  DELETE FROM medication_intakes
  WHERE medication_id = med_id
    AND status = 'pending'
    AND DATE(scheduled_time AT TIME ZONE 'Europe/Paris') > CURRENT_DATE;

  -- ⚠️ CORRECTION : Régénérer à partir d'AUJOURD'HUI (pas demain)
  -- Vérifier d'abord si des prises existent déjà pour aujourd'hui
  FOR i IN 0..6 LOOP
    intake_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    
    -- Pour chaque horaire du médicament
    FOR time_value IN SELECT unnest(md.times) LOOP
      -- Vérifier si une prise existe déjà pour cette date/heure
      IF NOT EXISTS (
        SELECT 1 FROM medication_intakes
        WHERE medication_id = med_id
          AND DATE(scheduled_time AT TIME ZONE 'Europe/Paris') = intake_date
          AND scheduled_time AT TIME ZONE 'Europe/Paris' = (intake_date + time_value::time)
      ) THEN
        -- Insérer uniquement si elle n'existe pas
        INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
        VALUES (
          med_id,
          timezone('UTC', timezone('Europe/Paris', (intake_date + time_value::time)::timestamp)),
          'pending',
          NOW(),
          NOW()
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 'Fonction regenerate_future_intakes corrigée : ne supprime plus les prises d''aujourd''hui' AS status;
