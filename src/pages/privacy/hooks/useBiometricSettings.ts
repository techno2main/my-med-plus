import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NativeBiometric } from "capacitor-native-biometric";

export const useBiometricSettings = (
  biometricEnabled: boolean,
  setBiometricEnabled: (enabled: boolean) => void
) => {
  const { toast } = useToast();

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, needsPassword: false };

      if (enabled) {
        const biometryResult = await NativeBiometric.isAvailable();
        
        if (!biometryResult.isAvailable) {
          toast({
            title: "Non disponible",
            description: "Votre appareil ne supporte pas l'authentification biométrique",
            variant: "destructive",
          });
          return { success: false, needsPassword: false };
        }

        return { success: false, needsPassword: true };
      } else {
        await NativeBiometric.deleteCredentials({
          server: "myhealth.app",
        });

        const { error } = await supabase
          .from('user_preferences')
          .update({ biometric_enabled: enabled })
          .eq('user_id', user.id);

        if (error) throw error;

        setBiometricEnabled(enabled);
        toast({
          title: "Succès",
          description: "Authentification biométrique désactivée",
        });
        
        return { success: true, needsPassword: false };
      }
    } catch (error: any) {
      console.error("Biometric error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de configurer l'authentification biométrique",
        variant: "destructive",
      });
      return { success: false, needsPassword: false };
    }
  };

  const handleBiometricPasswordConfirm = async (password: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) return false;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        toast({
          title: "Mot de passe incorrect",
          description: "Veuillez réessayer",
          variant: "destructive",
        });
        return false;
      }

      await NativeBiometric.verifyIdentity({
        reason: "Activer l'authentification biométrique",
        title: "Authentification",
        subtitle: "Utilisez votre empreinte digitale ou Face ID",
        description: "Sécurisez l'accès à MyHealth+",
      });

      await NativeBiometric.setCredentials({
        username: user.email,
        password: password,
        server: "myhealth.app",
      });

      await supabase
        .from('user_preferences')
        .update({ biometric_enabled: true })
        .eq('user_id', user.id);

      setBiometricEnabled(true);
      
      toast({
        title: "Succès",
        description: "Authentification biométrique activée",
      });

      return true;
    } catch (error: any) {
      console.error("Biometric setup error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer la biométrie",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleBiometricToggle,
    handleBiometricPasswordConfirm,
  };
};
