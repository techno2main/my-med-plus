-- =====================================================
-- Script : Auto-régénération des prises futures
-- Date : 20 octobre 2025
-- Description : Trigger pour régénérer automatiquement
--               les 7 prochains jours de prises quand
--               les horaires d'un médicament sont modifiés
-- =====================================================

-- 1. Fonction de régénération des prises futures pour un médicament
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
  -- On doit les convertir en UTC en soustrayant le décalage horaire
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
  ) AS intake_date
  CROSS JOIN LATERAL jsonb_array_elements_text(md.times::jsonb) AS time_value
  WHERE md.id = med_id
    AND md.times IS NOT NULL 
    AND md.times::jsonb != '[]'::jsonb
  ORDER BY scheduled_time;
  
  RAISE NOTICE 'Prises futures régénérées pour le médicament %', med_id;
END;
$$;

COMMENT ON FUNCTION regenerate_future_intakes IS 
  'Régénère les 7 prochains jours de prises pour un médicament donné. '
  'Supprime uniquement les prises futures (status=pending, scheduled_time > NOW) '
  'et les recrée avec les horaires actuels du médicament.';


-- 2. Trigger function appelée automatiquement sur UPDATE de medications
CREATE OR REPLACE FUNCTION auto_regenerate_intakes_on_times_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si le champ `times` a été modifié
  IF NEW.times IS DISTINCT FROM OLD.times THEN
    -- Régénérer les prises futures avec les nouveaux horaires
    PERFORM regenerate_future_intakes(NEW.id);
    
    RAISE NOTICE 'Horaires modifiés pour le médicament % (%), régénération des prises futures effectuée', 
                 NEW.name, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_regenerate_intakes_on_times_change IS 
  'Trigger function qui détecte les changements dans le champ times et régénère automatiquement les prises futures.';


-- 3. Créer le trigger sur la table medications
DROP TRIGGER IF EXISTS medication_times_changed ON medications;

CREATE TRIGGER medication_times_changed
  AFTER UPDATE OF times ON medications
  FOR EACH ROW
  WHEN (NEW.times IS DISTINCT FROM OLD.times)
  EXECUTE FUNCTION auto_regenerate_intakes_on_times_change();

COMMENT ON TRIGGER medication_times_changed ON medications IS 
  'Régénère automatiquement les prises futures quand les horaires (times) sont modifiés.';


-- =====================================================
-- Tests et vérifications
-- =====================================================

-- Test 1 : Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'medication_times_changed';


-- Test 2 : Exemple d'utilisation manuelle de la fonction
-- (à adapter avec un vrai medication_id)
-- SELECT regenerate_future_intakes('votre-medication-id-uuid');


-- =====================================================
-- Notes importantes
-- =====================================================

-- ✅ Ce qui est régénéré :
--    - Uniquement les prises avec status = 'pending'
--    - Uniquement les prises scheduled_time > NOW()
--    - Les 7 prochains jours (demain à J+7)

-- ❌ Ce qui n'est JAMAIS touché :
--    - Les prises passées (scheduled_time <= NOW())
--    - Les prises avec status = 'taken'
--    - Les prises avec status = 'skipped'
--    - L'historique

-- 🔄 Quand le trigger se déclenche :
--    - Modification du champ `times` dans la table `medications`
--    - Uniquement si les valeurs sont différentes (NEW.times != OLD.times)

-- 📊 Impact sur les performances :
--    - Faible : seulement sur UPDATE de medications.times
--    - Opération rapide : DELETE + INSERT de ~14-21 lignes max (7j × 1-3 prises/jour)

-- 🎯 Cas d'usage :
--    1. Utilisateur modifie l'horaire "09:30" → "10:00"
--       → Les prises futures passent automatiquement à 10:00
--    
--    2. Utilisateur ajoute un nouvel horaire : ["09:30"] → ["09:30", "19:30"]
--       → Une nouvelle prise à 19:30 est créée pour les 7 prochains jours
--    
--    3. Utilisateur supprime un horaire : ["09:30", "19:30"] → ["09:30"]
--       → Les prises à 19:30 sont supprimées pour les jours futurs

-- =====================================================
-- Rollback (si nécessaire)
-- =====================================================

-- Pour désactiver le système :
-- DROP TRIGGER IF EXISTS medication_times_changed ON medications;
-- DROP FUNCTION IF EXISTS auto_regenerate_intakes_on_times_change();
-- DROP FUNCTION IF EXISTS regenerate_future_intakes(UUID);
