import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(true);
  const [requireAuthOnOpen, setRequireAuthOnOpen] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger les préférences utilisateur
  const loadPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setIsLocked(false);
        return;
      }

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("biometric_enabled, require_auth_on_open")
        .eq("user_id", user.id)
        .maybeSingle();

      if (preferences) {
        const prefs = preferences as { biometric_enabled?: boolean; require_auth_on_open?: boolean };
        setBiometricEnabled(prefs.biometric_enabled ?? false);
        setRequireAuthOnOpen(prefs.require_auth_on_open ?? false);
        
        // Si l'option est activée, verrouiller au démarrage
        if (prefs.require_auth_on_open) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error);
      setIsLocked(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Écouter quand l'app revient au premier plan
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("appStateChange", async ({ isActive }) => {
      if (isActive && requireAuthOnOpen) {
        // Verrouiller quand l'app revient au premier plan
        setIsLocked(true);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [requireAuthOnOpen]);

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  const toggleRequireAuthOnOpen = useCallback(async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from("user_preferences")
        .update({ require_auth_on_open: enabled } as Record<string, unknown>)
        .eq("user_id", user.id);

      if (error) throw error;

      setRequireAuthOnOpen(enabled);
      return true;
    } catch (error) {
      console.error("Erreur mise à jour préférence:", error);
      return false;
    }
  }, []);

  return {
    isLocked,
    loading,
    requireAuthOnOpen,
    biometricEnabled,
    unlock,
    toggleRequireAuthOnOpen
  };
}
