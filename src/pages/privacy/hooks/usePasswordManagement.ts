import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { useToast } from "@/hooks/use-toast";
import { NativeBiometric } from "capacitor-native-biometric";

export const usePasswordManagement = (
  biometricEnabled: boolean,
  setBiometricEnabled: (enabled: boolean) => void
) => {
  const { toast } = useToast();

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      const { data: user, error } = await getAuthenticatedUser();
      if (error || !user || !user.email) {
        console.warn('[usePasswordManagement] Utilisateur non authentifié:', error?.message);
        toast({
          title: "Erreur",
          description: "Utilisateur non connecté",
          variant: "destructive",
        });
        return false;
      }

      // Validation des longueurs minimales
      if (currentPassword.length < 6) {
        toast({
          title: "Erreur",
          description: "Le mot de passe actuel doit contenir au moins 6 caractères",
          variant: "destructive",
        });
        return false;
      }

      if (newPassword.length < 6) {
        toast({
          title: "Erreur",
          description: "Le nouveau mot de passe doit contenir au moins 6 caractères",
          variant: "destructive",
        });
        return false;
      }

      // Vérifier le mot de passe actuel en tentant une connexion
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Mot de passe incorrect",
          description: "Le mot de passe actuel que vous avez saisi est incorrect",
          variant: "destructive",
        });
        return false;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      const { data: user, error: authError } = await getAuthenticatedUser();
      if (authError) {
        console.warn('[usePasswordManagement] Vérification auth impossible:', authError.message);
      }
      
      // Vérifier si l'email correspond à l'utilisateur connecté
      if (user && user.email && user.email.toLowerCase() !== email.toLowerCase()) {
        toast({
          title: "Email incorrect",
          description: "L'email saisi ne correspond pas à votre compte actuel",
          variant: "destructive",
        });
        return false;
      }

      // Si la biométrie est activée, la désactiver pour des raisons de sécurité
      if (biometricEnabled && user) {
        try {
          // Supprimer les credentials biométriques stockés
          await NativeBiometric.deleteCredentials({
            server: "myhealth.app",
          });

          // Mettre à jour la base de données
          const { error: updateError } = await supabase
            .from('user_preferences')
            .update({ 
              biometric_enabled: false,
              biometric_was_enabled: true // Flag pour proposer réactivation
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating biometric preference:', updateError);
          }

          setBiometricEnabled(false);
        } catch (bioError) {
          console.error('Error disabling biometric:', bioError);
        }
      }

      // Envoyer l'email de réinitialisation
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez également vos spams.",
        duration: 7000,
      });

      // Si biométrie était activée, informer l'utilisateur
      if (biometricEnabled) {
        setTimeout(() => {
          toast({
            title: "Biométrie désactivée",
            description: "L'authentification biométrique a été désactivée pour des raisons de sécurité. Vous pourrez la réactiver après avoir changé votre mot de passe.",
            duration: 7000,
          });
        }, 1000);
      }
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'email de réinitialisation",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handlePasswordChange,
    handleForgotPassword,
  };
};
