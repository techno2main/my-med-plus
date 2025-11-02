import { FormDialog } from "@/components/ui/organisms/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BiometricPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function BiometricPasswordDialog({
  open,
  onOpenChange,
  password,
  onPasswordChange,
  onSubmit,
}: BiometricPasswordDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
    onPasswordChange("");
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title="Activer l'authentification biométrique"
      description="Entrez votre mot de passe actuel pour activer la biométrie"
      onSubmit={onSubmit}
      submitLabel="Confirmer"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="biometric-password">Mot de passe</Label>
          <Input
            id="biometric-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>
    </FormDialog>
  );
}
