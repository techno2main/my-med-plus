import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { NativeBiometric } from "capacitor-native-biometric";

export const useAccountActions = (
  biometricEnabled: boolean,
  setTwoFactorEnabled: (enabled: boolean) => void
) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTwoFactorToggle = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_preferences')
        .update({ two_factor_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;

      setTwoFactorEnabled(enabled);
      toast({
        title: "Succès",
        description: `Authentification à deux facteurs ${enabled ? 'activée' : 'désactivée'}`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier les préférences",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: treatments } = await supabase
        .from('treatments')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        profile,
        treatments,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myhealth-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Succès",
        description: "Vos données ont été téléchargées",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'exporter les données",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteAccount = async (password: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Vérifier l'authentification selon le provider
      const provider = user.app_metadata.provider || 'email';

      // Pour les connexions email, vérifier le mot de passe
      if (provider === 'email' && user.email) {
        // Si biométrie activée, demander confirmation biométrique
        if (biometricEnabled) {
          try {
            await NativeBiometric.verifyIdentity({
              reason: "Confirmer la suppression du compte",
              title: "Authentification requise",
              subtitle: "Utilisez votre empreinte digitale ou Face ID",
              description: "Cette action est irréversible",
            });
          } catch (error) {
            toast({
              title: "Authentification échouée",
              description: "Impossible de vérifier votre identité",
              variant: "destructive",
            });
            return false;
          }
        } else {
          // Sinon, vérifier le mot de passe
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: password,
          });

          if (signInError) {
            toast({
              title: "Mot de passe incorrect",
              description: "Veuillez vérifier votre mot de passe",
              variant: "destructive",
            });
            return false;
          }
        }
      }

      // ⚠️ MODE TEST : Suppression désactivée pour validation du workflow
      // TODO: Décommenter ces lignes pour activer la suppression réelle
      /*
      // Supprimer les données utilisateur (les triggers RLS Supabase s'occuperont de la cascade)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('Error deleting profile:', deleteError);
      }

      // Supprimer le compte auth
      await supabase.auth.signOut();
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte et toutes vos données ont été supprimés avec succès",
      });
      
      navigate('/auth');
      */

      // MODE TEST : Simulation de succès sans suppression réelle
      console.log("🧪 MODE TEST : Suppression simulée (compte NON supprimé)");
      console.log("Provider:", provider);
      console.log("Biometric enabled:", biometricEnabled);
      console.log("User ID:", user.id);
      
      toast({
        title: "✅ TEST RÉUSSI",
        description: "Le workflow de suppression a été validé. Votre compte n'a PAS été supprimé.",
        duration: 5000,
      });
      
      return true;
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le compte",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleTwoFactorToggle,
    handleExportData,
    handleDeleteAccount,
  };
};
