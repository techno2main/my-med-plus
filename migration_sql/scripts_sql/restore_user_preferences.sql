-- Script de restauration des préférences utilisateur
-- Date: 2025-11-02
-- Description: Restaure les préférences biométrie et export_config perdues

-- Restaurer les données de la première ligne (avec vos préférences)
UPDATE public.user_preferences
SET 
  biometric_enabled = true,
  export_config = '{"format": "pdf", "endDate": "2025-10-30", "startDate": "2025-10-13", "includeStocks": true, "includeProfile": true, "includeAdherence": true, "includeTreatments": true, "includeIntakeHistory": true, "includePrescriptions": true}'::jsonb,
  updated_at = now()
WHERE user_id = '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb';
