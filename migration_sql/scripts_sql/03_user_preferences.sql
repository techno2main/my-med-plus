-- =====================================================
-- TABLE: public.user_preferences
-- Préférences utilisateur (biométrie, 2FA, etc.)
-- Date: 28 octobre 2025
-- =====================================================

-- DROP EXISTING
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- CREATE TABLE
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_enabled BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  export_config JSONB DEFAULT NULL
);

COMMENT ON TABLE public.user_preferences IS 'Préférences de sécurité et d''interface utilisateur';

-- ENABLE RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- TRIGGER
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- INSERT DATA
INSERT INTO "public"."user_preferences" ("id", "user_id", "biometric_enabled", "two_factor_enabled", "created_at", "updated_at", "export_config") 
VALUES ('239fb453-1f32-4db9-83e8-979e950d5c96', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'true', 'false', '2025-10-15 21:56:39.334379+00', '2025-10-30 00:40:49.165157+00', '{"format": "pdf", "endDate": "2025-10-30", "startDate": "2025-10-13", "includeStocks": true, "includeProfile": true, "includeAdherence": true, "includeTreatments": true, "includeIntakeHistory": true, "includePrescriptions": true}'::jsonb);
