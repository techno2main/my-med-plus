-- =====================================================
-- TYPES ET FONCTIONS - MyHealthPlus
-- Date: 28 octobre 2025
-- Source: Exports Supabase + Corrections manuelles
-- =====================================================

-- =========================
-- TYPE ENUM app_role
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

COMMENT ON TYPE public.app_role IS 
  'Rôles disponibles dans l''application: admin (administrateur) et user (utilisateur standard)';


-- =========================
-- FONCTION: update_updated_at_column()
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS 
  'Fonction trigger qui met à jour automatiquement le champ updated_at avec l''heure actuelle lors d''un UPDATE';


-- =========================
-- FONCTION: has_role()
-- =========================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

COMMENT ON FUNCTION public.has_role IS 
  'Vérifie si un utilisateur possède un rôle spécifique. Utilisée dans les politiques RLS pour les contrôles d''accès admin.';


-- =========================
-- FONCTION: regenerate_future_intakes()
-- =========================
-- OPTIMISATION : Ne supprime PLUS les prises pending
-- Conserve les prises existantes (prises en avance, notes, modifications)
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
BEGIN
  -- Récupérer les horaires du médicament
  SELECT times INTO md_times
  FROM medications
  WHERE id = med_id;

  -- Vérifier que times n'est pas vide
  IF md_times IS NULL OR array_length(md_times, 1) = 0 THEN
    RETURN;
  END IF;

  -- ✅ PLUS DE DELETE : On crée uniquement ce qui manque
  -- Régénérer 7 jours à partir d'AUJOURD'HUI
  FOR i IN 0..6 LOOP
    intake_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    
    -- Pour chaque horaire du médicament
    FOREACH time_value IN ARRAY md_times LOOP
      -- Vérifier si une prise existe déjà pour cette date/heure (n'importe quel status)
      IF NOT EXISTS (
        SELECT 1 FROM medication_intakes
        WHERE medication_id = med_id
          AND DATE(scheduled_time AT TIME ZONE 'Europe/Paris') = intake_date
          AND TO_CHAR(scheduled_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') = time_value
      ) THEN
        -- Insérer uniquement si elle n'existe pas
        INSERT INTO medication_intakes (medication_id, scheduled_time, status, created_at, updated_at)
        VALUES (
          med_id,
          timezone('UTC', timezone('Europe/Paris', (intake_date || ' ' || time_value)::timestamp)),
          'pending',
          NOW(),
          NOW()
        );
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Prises futures vérifiées/créées pour le médicament % (sans suppression)', med_id;
END;
$$;

COMMENT ON FUNCTION public.regenerate_future_intakes IS 
  'Régénère les 7 prochains jours de prises pour un médicament donné. '
  'NE SUPPRIME PLUS les prises existantes (conserve taken, skipped, notes). '
  'Crée uniquement les prises manquantes.';


-- =========================
-- FONCTION: auto_regenerate_intakes_on_times_change()
-- =========================
CREATE OR REPLACE FUNCTION public.auto_regenerate_intakes_on_times_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION public.auto_regenerate_intakes_on_times_change IS 
  'Trigger function qui détecte les changements dans le champ times et régénère automatiquement les prises futures.';
