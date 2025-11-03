import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog";
import { TimeSelect } from "@/components/ui/time-select";
import type { ConfirmationDialog } from "../utils/rattrapageTypes";
import { useState } from "react";
import { format } from "date-fns";

interface ConfirmationDialogProps {
  confirmDialog: ConfirmationDialog;
  onClose: () => void;
  onConfirm: (actualTakenTime?: string) => void;
}

export function RattrapageConfirmationDialog({
  confirmDialog,
  onClose,
  onConfirm,
}: ConfirmationDialogProps) {
  const [actualTakenTime, setActualTakenTime] = useState(confirmDialog.displayTime);
  
  const getConfirmationMessage = () => {
    switch (confirmDialog.action) {
      case 'taken':
        return "Confirmer l'heure à laquelle vous avez pris ce médicament";
      case 'taken_now':
        const currentTime = format(new Date(), 'HH:mm');
        return `Confirmer que vous voulez prendre ce médicament maintenant (heure actuelle réelle) : ${currentTime} ?`;
      case 'skipped':
        return "Confirmer que vous n'avez pas pris ce médicament et qu'il est trop tard pour le prendre ?";
      default:
        return "Confirmer cette action ?";
    }
  };

  const handleConfirm = () => {
    if (confirmDialog.action === 'taken') {
      onConfirm(actualTakenTime);
    } else {
      onConfirm();
    }
  };

  return (
    <ConfirmDialog
      open={confirmDialog.isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Confirmer l'action"
      description={getConfirmationMessage()}
    >
      <div className="space-y-4">
        <div className="font-medium text-foreground">
          {confirmDialog.medicationName}
        </div>
        <div className="text-sm text-muted-foreground">
          {confirmDialog.dayName} - {confirmDialog.displayTime}
        </div>
        
        {confirmDialog.action === 'taken' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Heure de prise réelle
            </label>
            <TimeSelect 
              value={actualTakenTime} 
              onValueChange={setActualTakenTime}
              placeholder="HH:MM"
            />
          </div>
        )}
      </div>
    </ConfirmDialog>
  );
}
