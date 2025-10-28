-- Types et fonctions de base pour MyHealthPlus
-- Date: 28 octobre 2025

-- Type ENUM app_role
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

COMMENT ON TYPE public.app_role IS 
  'Rôles disponibles dans l''application: admin (administrateur) et user (utilisateur standard)';

-- Fonction: update_updated_at_column()
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

-- Fonction: has_role()
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

-- Fonction: regenerate_future_intakes()
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
  SELECT times INTO md_times
  FROM medications
  WHERE id = med_id;

  IF md_times IS NULL OR array_length(md_times, 1) = 0 THEN
    RETURN;
  END IF;

  FOR i IN 0..6 LOOP
    intake_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    
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

COMMENT ON FUNCTION public.regenerate_future_intakes IS 
  'Régénère les prises futures pour un médicament (7 jours). Conserve les prises existantes.';

-- Fonction: update_stock_on_intake()
CREATE OR REPLACE FUNCTION public.update_stock_on_intake()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'taken' AND (OLD.status IS NULL OR OLD.status != 'taken') THEN
    UPDATE medications
    SET current_stock = GREATEST(0, current_stock - 1),
        updated_at = NOW()
    WHERE id = NEW.medication_id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_stock_on_intake IS 
  'Décrémente automatiquement le stock d''un médicament lors d''une prise confirmée';

-- Fonction: auto_regenerate_intakes_on_times_change()
CREATE OR REPLACE FUNCTION public.auto_regenerate_intakes_on_times_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.times IS DISTINCT FROM OLD.times THEN
    PERFORM regenerate_future_intakes(NEW.id);
    
    RAISE NOTICE 'Horaires modifiés pour le médicament % (%), régénération des prises futures effectuée', 
                 NEW.name, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_regenerate_intakes_on_times_change IS 
  'Trigger function qui détecte les changements dans le champ times et régénère automatiquement les prises futures.';
