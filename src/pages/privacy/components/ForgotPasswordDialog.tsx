import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, AlertTriangle } from "lucide-react";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (email: string) => Promise<boolean>;
  biometricEnabled: boolean;
  isSending: boolean;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  onConfirm,
  biometricEnabled,
  isSending,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");

  const handleClose = () => {
    setEmail("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!email || !email.includes("@")) {
      return;
    }

    const success = await onConfirm(email);
    if (success) {
      handleClose();
    }
  };

  const canSubmit = email.includes("@") && !isSending;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Mot de passe oublié
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-justify">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {/* Avertissement biométrie */}
              {biometricEnabled && (
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-warning">
                      Attention : Désactivation de la biométrie
                    </p>
                    <p className="text-xs text-muted-foreground text-justify">
                      Si la biométrie est activée, elle sera automatiquement désactivée pour des raisons de sécurité. Vous pourrez la réactiver après avoir changé votre mot de passe et vous être reconnecté.
                    </p>
                  </div>
                </div>
              )}

              {/* Champ email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Adresse email <span className="text-danger">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                  autoComplete="email"
                />
                {email && !email.includes("@") && (
                  <p className="text-xs text-warning">
                    Veuillez entrer une adresse email valide
                  </p>
                )}
              </div>

              {/* Information */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground text-justify">
                  💡 Vous recevrez un email avec un lien de réinitialisation valide pendant 1 heure. Vérifiez également vos spams si vous ne le recevez pas.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            className="w-full sm:w-auto m-0" 
            disabled={isSending}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          >
            {isSending ? "Envoi en cours..." : "Envoyer le lien"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
