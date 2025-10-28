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

interface ConfirmationAlertsProps {
  // Biometric
  biometricOpen: boolean;
  biometricEnabled: boolean;
  onBiometricOpenChange: (open: boolean) => void;
  onBiometricConfirm: () => void;
  
  // 2FA
  twoFactorOpen: boolean;
  twoFactorEnabled: boolean;
  onTwoFactorOpenChange: (open: boolean) => void;
  onTwoFactorConfirm: () => void;
  
  // Export
  exportOpen: boolean;
  onExportOpenChange: (open: boolean) => void;
  onExportConfirm: () => void;
  
  // Delete
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
}

export function ConfirmationAlerts({
  biometricOpen,
  biometricEnabled,
  onBiometricOpenChange,
  onBiometricConfirm,
  twoFactorOpen,
  twoFactorEnabled,
  onTwoFactorOpenChange,
  onTwoFactorConfirm,
  exportOpen,
  onExportOpenChange,
  onExportConfirm,
  deleteOpen,
  onDeleteOpenChange,
  onDeleteConfirm,
}: ConfirmationAlertsProps) {
  return (
    <>
      {/* Biometric Confirmation */}
      <AlertDialog open={biometricOpen} onOpenChange={onBiometricOpenChange}>
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
            <AlertDialogAction onClick={onBiometricConfirm}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Two Factor Confirmation */}
      <AlertDialog open={twoFactorOpen} onOpenChange={onTwoFactorOpenChange}>
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
            <AlertDialogAction onClick={onTwoFactorConfirm}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Confirmation */}
      <AlertDialog open={exportOpen} onOpenChange={onExportOpenChange}>
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
            <AlertDialogAction onClick={onExportConfirm}>
              Télécharger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
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
              onClick={onDeleteConfirm}
              className="bg-danger hover:bg-danger/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
