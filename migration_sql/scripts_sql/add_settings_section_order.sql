-- Migration: Ajouter la colonne settings_section_order à user_preferences
-- Date: 2025-11-02
-- Description: Permet aux utilisateurs de personnaliser l'ordre des sections dans Settings

ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS settings_section_order JSONB DEFAULT NULL;

COMMENT ON COLUMN public.user_preferences.settings_section_order 
IS 'Ordre personnalisé des sections dans la page Settings (format: [{id, title, order, visible}])';
