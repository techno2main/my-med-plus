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
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (currentPassword: string, newPassword: string) => Promise<boolean>;
  onForgotPassword?: () => void;
  isChanging: boolean;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onConfirm,
  onForgotPassword,
  isChanging,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  };

  const handleForgotPassword = () => {
    handleClose();
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  const handleConfirm = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }

    if (newPassword.length < 6) {
      return;
    }

    const success = await onConfirm(currentPassword, newPassword);
    if (success) {
      handleClose();
    }
  };

  const canSubmit = 
    currentPassword.length >= 6 && 
    newPassword.length >= 6 && 
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword &&
    !isChanging;

  const passwordsMatch = newPassword === confirmPassword || confirmPassword === "";

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Changer le mot de passe
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Entrez votre nouveau mot de passe (minimum 6 caractères)
              </p>

              {/* Mot de passe actuel */}
              <div className="space-y-2">
                <Label htmlFor="current-password">
                  Mot de passe actuel <span className="text-danger">*</span>
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChanging}
                  autoComplete="current-password"
                />
              </div>

              {/* Nouveau mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  Nouveau mot de passe <span className="text-danger">*</span>
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChanging}
                  autoComplete="new-password"
                />
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-warning">
                    Le mot de passe doit contenir au moins 6 caractères
                  </p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirmer le mot de passe <span className="text-danger">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChanging}
                  autoComplete="new-password"
                />
                {!passwordsMatch && (
                  <p className="text-xs text-danger">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              {/* Lien mot de passe oublié */}
              {onForgotPassword && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm text-primary"
                  onClick={handleForgotPassword}
                  disabled={isChanging}
                >
                  Mot de passe oublié ?
                </Button>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            className="w-full sm:w-auto m-0" 
            disabled={isChanging}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          >
            {isChanging ? "Modification en cours..." : "Confirmer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
