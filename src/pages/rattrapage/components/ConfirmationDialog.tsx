import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
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
          <DialogDescription className="space-y-2">
            <div className="font-medium text-foreground">
              {confirmDialog.medicationName}
            </div>
            <div className="text-sm">
              {confirmDialog.dayName} - {format(new Date(confirmDialog.scheduledTime), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
            </div>
            <div className="pt-2">
              {getConfirmationMessage()}
            </div>
          </DialogDescription>
        </DialogHeader>
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
