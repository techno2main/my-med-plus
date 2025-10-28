-- =====================================================
-- TRIGGERS - MyHealthPlus
-- Date: 28 octobre 2025
-- Source: Public Schema Trigger Overview.csv (export Supabase)
-- =====================================================

-- =========================
-- TRIGGERS: Mise à jour automatique de updated_at
-- =========================

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pathologies_updated_at 
  BEFORE UPDATE ON public.pathologies
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at 
  BEFORE UPDATE ON public.allergies
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_catalog_updated_at 
  BEFORE UPDATE ON public.medication_catalog
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_professionals_updated_at 
  BEFORE UPDATE ON public.health_professionals
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at 
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at 
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at 
  BEFORE UPDATE ON public.medications
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_visits_updated_at 
  BEFORE UPDATE ON public.pharmacy_visits
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_intakes_updated_at 
  BEFORE UPDATE ON public.medication_intakes
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();


-- =========================
-- TRIGGER: Régénération automatique des prises futures
-- =========================

CREATE TRIGGER medication_times_changed
  AFTER UPDATE OF times ON public.medications
  FOR EACH ROW
  WHEN (NEW.times IS DISTINCT FROM OLD.times)
  EXECUTE FUNCTION public.auto_regenerate_intakes_on_times_change();

COMMENT ON TRIGGER medication_times_changed ON public.medications IS 
  'Régénère automatiquement les prises futures (7 jours) quand les horaires (times) d''un médicament sont modifiés. Ne supprime pas les prises existantes.';
