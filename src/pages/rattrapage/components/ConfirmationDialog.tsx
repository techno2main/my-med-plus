import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    <Dialog open={confirmDialog.isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer l'action</DialogTitle>
          <DialogDescription>
            {getConfirmationMessage()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <div className="font-medium text-foreground">
            {confirmDialog.medicationName}
          </div>
          <div className="text-sm text-muted-foreground">
            {confirmDialog.dayName} - {confirmDialog.displayTime}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
