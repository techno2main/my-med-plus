-- ============================================================================
-- MAJ de la fonction regenerate_future_intakes avec conversion UTC correcte
-- ============================================================================
-- À exécuter AVANT le script fix_future_intakes_utc.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION regenerate_future_intakes(med_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer uniquement les prises FUTURES et PENDING
  -- Ne jamais toucher aux prises passées ou déjà prises/sautées
  DELETE FROM medication_intakes 
  WHERE medication_id = med_id
    AND status = 'pending'
    AND scheduled_time > NOW();
  
  -- Régénérer les 7 prochains jours avec les horaires actuels
  -- IMPORTANT : Les horaires dans md.times sont en heure LOCALE Paris
  -- On doit les convertir en UTC en utilisant timezone()
  INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
  SELECT 
    md.id AS medication_id,
    -- Créer un timestamp en zone Europe/Paris puis le convertir en UTC
    timezone('UTC', timezone('Europe/Paris', (d.intake_date || ' ' || time_value::text)::timestamp)) AS scheduled_time,
    'pending' AS status,
    NOW() AS created_at,
    NOW() AS updated_at
  FROM medications md
  CROSS JOIN generate_series(
    CURRENT_DATE + INTERVAL '1 day',  -- À partir de demain
    CURRENT_DATE + INTERVAL '7 days', -- Jusqu'à dans 7 jours
    INTERVAL '1 day'
  ) AS d(intake_date)
  CROSS JOIN LATERAL jsonb_array_elements_text(md.times::jsonb) AS time_value
  WHERE md.id = med_id
    AND md.times IS NOT NULL 
    AND md.times::jsonb != '[]'::jsonb
  ORDER BY scheduled_time;
  
  RAISE NOTICE 'Prises futures régénérées pour le médicament % avec conversion UTC correcte', med_id;
END;
$$;

COMMENT ON FUNCTION regenerate_future_intakes IS 
  'Régénère les 7 prochains jours de prises pour un médicament donné. '
  'Supprime uniquement les prises futures (status=pending, scheduled_time > NOW) '
  'et les recrée avec les horaires actuels du médicament. '
  'CONVERTIT automatiquement heure Paris → UTC (gère hiver/été).';
