import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog";
import type { ConfirmationDialog } from "../utils/rattrapageTypes";

interface ConfirmationDialogProps {
  confirmDialog: ConfirmationDialog;
  onClose: () => void;
  onConfirm: () => void;
}

export function RattrapageConfirmationDialog({
  confirmDialog,
  onClose,
  onConfirm,
}: ConfirmationDialogProps) {
  const getConfirmationMessage = () => {
    switch (confirmDialog.action) {
      case 'taken':
        return "Confirmer que vous avez pris ce médicament à l'heure prévue mais avez oublié de cliquer sur le bouton ?";
      case 'taken_now':
        return "Confirmer que vous voulez prendre ce médicament maintenant (heure actuelle réelle) ?";
      case 'skipped':
        return "Confirmer que vous n'avez pas pris ce médicament et qu'il est trop tard pour le prendre ?";
      default:
        return "Confirmer cette action ?";
    }
  };

  return (
    <ConfirmDialog
      open={confirmDialog.isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmer l'action"
      description={getConfirmationMessage()}
    >
      <div className="space-y-2">
        <div className="font-medium text-foreground">
          {confirmDialog.medicationName}
        </div>
        <div className="text-sm text-muted-foreground">
          {confirmDialog.dayName} - {confirmDialog.displayTime}
        </div>
      </div>
    </ConfirmDialog>
  );
}
