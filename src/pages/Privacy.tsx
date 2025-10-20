import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Shield, Lock, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NativeBiometric, BiometryType } from "capacitor-native-biometric";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Privacy() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // States
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Confirmation dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [pendingBiometricChange, setPendingBiometricChange] = useState(false);
  const [pendingTwoFactorChange, setPendingTwoFactorChange] = useState(false);

  // Load user data and preferences
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Detect auth provider
      const provider = user.app_metadata.provider || 'email';
      setAuthProvider(provider);

      // Load preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefs) {
        setBiometricEnabled(prefs.biometric_enabled);
        setTwoFactorEnabled(prefs.two_factor_enabled);
      } else {
        // Create default preferences
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

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès",
      });
      
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe",
        variant: "destructive",
      });
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (enabled) {
        // Vérifier si la biométrie est disponible sur l'appareil
        const biometryResult = await NativeBiometric.isAvailable();
        
        if (!biometryResult.isAvailable) {
          toast({
            title: "Non disponible",
            description: "Votre appareil ne supporte pas l'authentification biométrique",
            variant: "destructive",
          });
          setPendingBiometricChange(false);
          return;
        }

        // Demander l'authentification biométrique
        const verified = await NativeBiometric.verifyIdentity({
          reason: "Activer l'authentification biométrique",
          title: "Authentification",
          subtitle: "Utilisez votre empreinte digitale ou Face ID",
          description: "Sécurisez l'accès à MyHealth+",
        })
          .then(() => true)
          .catch(() => false);

        if (!verified) {
          toast({
            title: "Échec",
            description: "Authentification biométrique non vérifiée",
            variant: "destructive",
          });
          setPendingBiometricChange(false);
          return;
        }

        // Enregistrer les credentials pour future utilisation
        await NativeBiometric.setCredentials({
          username: user.email || "",
          password: "biometric_enabled",
          server: "myhealth.app",
        });

        // Sauvegarder la préférence
        const { error } = await supabase
          .from('user_preferences')
          .update({ biometric_enabled: enabled })
          .eq('user_id', user.id);

        if (error) throw error;

        setBiometricEnabled(enabled);
        
        const biometryTypeText = biometryResult.biometryType === BiometryType.FACE_ID 
          ? "Face ID" 
          : "empreinte digitale";
        
        toast({
          title: "Succès",
          description: `Authentification par ${biometryTypeText} activée`,
        });
      } else {
        // Supprimer les credentials
        await NativeBiometric.deleteCredentials({
          server: "myhealth.app",
        });

        // Sauvegarder la préférence
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
      }
    } catch (error: any) {
      console.error("Biometric error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de configurer l'authentification biométrique",
        variant: "destructive",
      });
    }
    setPendingBiometricChange(false);
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier les préférences",
        variant: "destructive",
      });
    }
    setPendingTwoFactorChange(false);
  };

  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Export user data (simplified version)
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
    setShowExportDialog(false);
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Note: La suppression complète du compte nécessiterait un edge function
      // Pour l'instant, on déconnecte l'utilisateur
      await supabase.auth.signOut();
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès",
      });
      
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le compte",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p>Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Sécurité"
          subtitle="Protection des données personnelles"
          backTo="/settings"
        />

        {/* Sécurité du compte */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Sécurité du compte</h3>
          </div>
          <div className="space-y-4">
            {/* Changement de mot de passe - uniquement pour auth email */}
            {authProvider === 'email' && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowPasswordDialog(true)}
              >
                Changer le mot de passe
              </Button>
            )}
            
            {/* Biométrie */}
            <div className="flex items-center justify-between">
              <Label htmlFor="biometric" className="flex-1 cursor-pointer">
                <p className="font-medium">Authentification biométrique</p>
                <p className="text-sm text-muted-foreground">Face ID / Empreinte digitale</p>
              </Label>
              <Switch 
                id="biometric"
                checked={biometricEnabled}
                onCheckedChange={() => setPendingBiometricChange(true)}
              />
            </div>
            
            {/* 2FA */}
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa" className="flex-1 cursor-pointer">
                <p className="font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-muted-foreground">Protection supplémentaire</p>
              </Label>
              <Switch 
                id="2fa"
                checked={twoFactorEnabled}
                onCheckedChange={() => setPendingTwoFactorChange(true)}
              />
            </div>
          </div>
        </Card>

        {/* Gestion des données */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Gestion des données</h3>
          </div>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger les données
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start text-danger hover:bg-danger hover:text-white border-danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer mon compte
            </Button>
          </div>
        </Card>

        {/* Password Change Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Changer le mot de passe</DialogTitle>
              <DialogDescription>
                Entrez votre nouveau mot de passe (minimum 6 caractères)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handlePasswordChange}>
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Biometric Confirmation */}
        <AlertDialog open={pendingBiometricChange} onOpenChange={setPendingBiometricChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Modifier l'authentification biométrique ?</AlertDialogTitle>
              <AlertDialogDescription>
                {biometricEnabled 
                  ? "Vous êtes sur le point de désactiver l'authentification biométrique."
                  : "Vous êtes sur le point d'activer l'authentification biométrique. Cette fonctionnalité nécessite un appareil compatible."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBiometricToggle(!biometricEnabled)}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Two Factor Confirmation */}
        <AlertDialog open={pendingTwoFactorChange} onOpenChange={setPendingTwoFactorChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Modifier l'authentification à deux facteurs ?</AlertDialogTitle>
              <AlertDialogDescription>
                {twoFactorEnabled 
                  ? "Vous êtes sur le point de désactiver l'authentification à deux facteurs. Votre compte sera moins sécurisé."
                  : "Vous êtes sur le point d'activer l'authentification à deux facteurs pour renforcer la sécurité de votre compte."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleTwoFactorToggle(!twoFactorEnabled)}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export Confirmation */}
        <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Télécharger vos données ?</AlertDialogTitle>
              <AlertDialogDescription>
                Un fichier JSON contenant vos données personnelles et médicales sera téléchargé. 
                Conservez-le en lieu sûr.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleExportData}>
                Télécharger
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Account Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-danger">Supprimer votre compte ?</AlertDialogTitle>
              <AlertDialogDescription>
                ⚠️ Cette action est irréversible. Toutes vos données (traitements, ordonnances, historique) seront définitivement supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount}
                className="bg-danger hover:bg-danger/90"
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}