import { FormDialog } from "@/components/ui/organisms/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function PasswordChangeDialog({
  open,
  onOpenChange,
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: PasswordChangeDialogProps) {
  return (
    <FormDialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Changer le mot de passe"
      description="Entrez votre nouveau mot de passe (minimum 6 caractères)"
      onSubmit={onSubmit}
      submitLabel="Confirmer"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>
    </FormDialog>
  );
}
