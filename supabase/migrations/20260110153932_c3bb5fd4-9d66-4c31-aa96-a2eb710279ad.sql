-- =====================================================
-- CORRECTION: Nettoyage des prises fantômes et amélioration de la mécanique
-- =====================================================

-- 1. NETTOYAGE: Supprimer les prises "pending" pour traitements archivés ou après end_date
DELETE FROM medication_intakes mi
USING medications m, treatments t
WHERE mi.medication_id = m.id
  AND m.treatment_id = t.id
  AND mi.status = 'pending'
  AND (
    t.is_active = false
    OR (t.end_date IS NOT NULL AND DATE(mi.scheduled_time) > t.end_date)
  );

-- 2. AMÉLIORATION: Fonction regenerate_future_intakes avec vérifications
CREATE OR REPLACE FUNCTION public.regenerate_future_intakes(med_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intake_date DATE;
  time_value TEXT;
  md_times TEXT[];
  med_is_paused BOOLEAN;
  treatment_end_date DATE;
  treatment_active BOOLEAN;
BEGIN
  -- Récupérer les infos du médicament ET du traitement
  SELECT m.times, m.is_paused, t.end_date, t.is_active 
  INTO md_times, med_is_paused, treatment_end_date, treatment_active
  FROM medications m
  JOIN treatments t ON m.treatment_id = t.id
  WHERE m.id = med_id;

  -- Ne rien faire si traitement inactif
  IF treatment_active = false THEN
    RETURN;
  END IF;

  -- Ne pas générer de prises si le médicament est en pause
  IF med_is_paused = true THEN
    RETURN;
  END IF;

  IF md_times IS NULL OR array_length(md_times, 1) = 0 THEN
    RETURN;
  END IF;

  FOR i IN 0..6 LOOP
    intake_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    
    -- Ne pas générer de prises après la date de fin du traitement
    IF treatment_end_date IS NOT NULL AND intake_date > treatment_end_date THEN
      CONTINUE;
    END IF;
    
    FOREACH time_value IN ARRAY md_times LOOP
      IF NOT EXISTS (
        SELECT 1 FROM medication_intakes
        WHERE medication_id = med_id
          AND DATE(scheduled_time AT TIME ZONE 'Europe/Paris') = intake_date
          AND TO_CHAR(scheduled_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') = time_value
      ) THEN
        INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
        VALUES (
          med_id,
          (intake_date || ' ' || time_value || ':00')::TIMESTAMP AT TIME ZONE 'Europe/Paris',
          'pending',
          NOW(),
          NOW()
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 3. NOUVEAU: Fonction de nettoyage automatique lors de l'archivage
CREATE OR REPLACE FUNCTION public.cleanup_pending_intakes_on_archive()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si le traitement passe à inactif
  IF NEW.is_active = false AND OLD.is_active = true THEN
    DELETE FROM medication_intakes mi
    USING medications m
    WHERE mi.medication_id = m.id
      AND m.treatment_id = NEW.id
      AND mi.status = 'pending'
      AND DATE(mi.scheduled_time) > CURRENT_DATE;
      
    RAISE NOTICE 'Prises pending futures supprimées pour le traitement archivé %', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. NOUVEAU: Trigger pour le nettoyage automatique
DROP TRIGGER IF EXISTS treatment_archived_cleanup ON treatments;
CREATE TRIGGER treatment_archived_cleanup
  AFTER UPDATE OF is_active ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_pending_intakes_on_archive();

COMMENT ON FUNCTION public.cleanup_pending_intakes_on_archive() IS 
  'Nettoie automatiquement les prises pending futures quand un traitement est archivé';

COMMENT ON TRIGGER treatment_archived_cleanup ON treatments IS 
  'Déclenche le nettoyage des prises pending quand is_active passe à false';