import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { usePasswordManagement } from "./usePasswordManagement";
import { useBiometricSettings } from "./useBiometricSettings";
import { useAccountActions } from "./useAccountActions";
import { toast } from "sonner";

export const usePrivacySettings = () => {
  const navigate = useNavigate();
  
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [requireAuthOnOpen, setRequireAuthOnOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: user, error } = await getAuthenticatedUser();
      if (error || !user) {
        console.warn('[usePrivacySettings] Utilisateur non authentifié:', error?.message);
        navigate('/auth');
        return;
      }

      const provider = user.app_metadata.provider || 'email';
      setAuthProvider(provider);

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefs) {
        setBiometricEnabled(prefs.biometric_enabled ?? false);
        setTwoFactorEnabled(prefs.two_factor_enabled ?? false);
        setRequireAuthOnOpen((prefs as { require_auth_on_open?: boolean }).require_auth_on_open ?? false);
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            biometric_enabled: false,
            two_factor_enabled: false,
          });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hooks spécialisés
  const { handlePasswordChange, handleForgotPassword } = usePasswordManagement(
    biometricEnabled,
    setBiometricEnabled
  );

  const { handleBiometricToggle, handleBiometricPasswordConfirm } = useBiometricSettings(
    biometricEnabled,
    setBiometricEnabled
  );

  const { handleTwoFactorToggle, handleExportData, handleDeleteAccount } = useAccountActions(
    biometricEnabled,
    setTwoFactorEnabled
  );

  const handleRequireAuthOnOpenToggle = async (enabled: boolean) => {
    try {
      const { data: user } = await getAuthenticatedUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .update({ require_auth_on_open: enabled } as Record<string, unknown>)
        .eq('user_id', user.id);

      if (error) throw error;

      setRequireAuthOnOpen(enabled);
      toast.success(enabled ? "Verrouillage activé" : "Verrouillage désactivé");
    } catch (error) {
      console.error('Erreur mise à jour préférence:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return {
    authProvider,
    biometricEnabled,
    twoFactorEnabled,
    requireAuthOnOpen,
    loading,
    handlePasswordChange,
    handleForgotPassword,
    handleBiometricToggle,
    handleBiometricPasswordConfirm,
    handleTwoFactorToggle,
    handleRequireAuthOnOpenToggle,
    handleExportData,
    handleDeleteAccount,
  };
};
