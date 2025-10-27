-- OPTIMISATION : Suppression du DELETE inutile et dangereux
-- La fonction vérifie déjà l'existence avant insertion, donc pas besoin de supprimer
-- Avantages :
--   ✅ Plus sûr (ne supprime jamais de données)
--   ✅ Conserve les notes/modifications utilisateur
--   ✅ Plus rapide (pas de DELETE)
--   ✅ Conserve les prises prises en avance (taken par anticipation)

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

  -- ✅ PLUS DE DELETE : On ne supprime rien, on crée uniquement ce qui manque
  
  -- Régénérer 7 jours à partir d'AUJOURD'HUI
  FOR i IN 0..6 LOOP
    intake_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    
    -- Pour chaque horaire du médicament
    FOR time_value IN SELECT unnest(md.times) LOOP
      -- Vérifier si une prise existe déjà pour cette date/heure (n'importe quel status)
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
SELECT 'Fonction regenerate_future_intakes optimisée : plus de DELETE, création uniquement si manquant' AS status;
