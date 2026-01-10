-- Fonction d'archivage automatique des traitements expirés
CREATE OR REPLACE FUNCTION public.auto_archive_expired_treatments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Archiver les traitements dont la date de fin est dépassée
  UPDATE treatments
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE is_active = true
    AND end_date IS NOT NULL
    AND end_date < CURRENT_DATE;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Le trigger treatment_archived_cleanup va automatiquement 
  -- supprimer les prises pending futures
  
  RETURN archived_count;
END;
$$;

-- Amélioration de regenerate_future_intakes pour respecter la date de début du traitement
CREATE OR REPLACE FUNCTION public.regenerate_future_intakes(med_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  intake_date DATE;
  time_value TEXT;
  md_times TEXT[];
  med_is_paused BOOLEAN;
  treatment_end_date DATE;
  treatment_start_date DATE;
  treatment_active BOOLEAN;
  start_from_date DATE;
BEGIN
  -- Récupérer les infos du médicament ET du traitement
  SELECT m.times, m.is_paused, t.end_date, t.start_date, t.is_active 
  INTO md_times, med_is_paused, treatment_end_date, treatment_start_date, treatment_active
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

  -- Commencer à partir de la date la plus tardive entre aujourd'hui et la date de début du traitement
  start_from_date := GREATEST(CURRENT_DATE, treatment_start_date);

  FOR i IN 0..6 LOOP
    intake_date := start_from_date + (i || ' days')::INTERVAL;
    
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