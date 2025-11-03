import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExportConfig } from "../types";
import { getAuthenticatedUser } from "@/lib/auth-guard";

// Dates par défaut : début 13/10/2025, fin = date du jour
const getDefaultDates = () => {
  const startDate = new Date(2025, 9, 13); // 13 octobre 2025 (mois 9 = octobre car base 0)
  const endDate = new Date(); // Date du jour
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

const defaultDates = getDefaultDates();

const DEFAULT_CONFIG: ExportConfig = {
  includeProfile: true,
  includeAdherence: true,
  includeTreatments: true,
  includePrescriptions: true,
  includeIntakeHistory: true,
  includeStocks: true,
  startDate: defaultDates.startDate,
  endDate: defaultDates.endDate,
  format: 'pdf',
};

export const useExportConfig = () => {
  const [config, setConfig] = useState<ExportConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: user, error } = await getAuthenticatedUser();
      if (error || !user) {
        console.warn('[useExportConfig] Utilisateur non authentifié:', error?.message);
        setLoading(false);
        return;
      }

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefs?.export_config) {
        setConfig({ ...DEFAULT_CONFIG, ...(prefs.export_config as object) });
      }
    } catch (error) {
      console.error("[useExportConfig] Error loading export config:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<ExportConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    try {
      const { data: user, error } = await getAuthenticatedUser();
      if (error || !user) {
        console.warn('[useExportConfig] Utilisateur non authentifié pour update:', error?.message);
        return;
      }

      await supabase
        .from('user_preferences')
        .update({ export_config: updatedConfig })
        .eq('user_id', user.id);
    } catch (error) {
      console.error("[useExportConfig] Error saving export config:", error);
    }
  };

  return { config, updateConfig, loading };
};
