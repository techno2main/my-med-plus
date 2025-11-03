import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { usePasswordManagement } from "./usePasswordManagement";
import { useBiometricSettings } from "./useBiometricSettings";
import { useAccountActions } from "./useAccountActions";

export const usePrivacySettings = () => {
  const navigate = useNavigate();
  
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
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
        setBiometricEnabled(prefs.biometric_enabled);
        setTwoFactorEnabled(prefs.two_factor_enabled);
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

  return {
    authProvider,
    biometricEnabled,
    twoFactorEnabled,
    loading,
    handlePasswordChange,
    handleForgotPassword,
    handleBiometricToggle,
    handleBiometricPasswordConfirm,
    handleTwoFactorToggle,
    handleExportData,
    handleDeleteAccount,
  };
};
