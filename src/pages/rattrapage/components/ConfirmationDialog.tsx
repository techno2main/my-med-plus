import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog";
import { TimePickerInput } from "@/components/ui/time-picker-dialog";
import type { ConfirmationDialog } from "../utils/rattrapageTypes";
import { useState, useEffect } from "react";
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
  
  // Réinitialiser l'heure à l'heure prévue quand le dialogue s'ouvre
  useEffect(() => {
    if (confirmDialog.isOpen) {
      setActualTakenTime(confirmDialog.displayTime);
    }
  }, [confirmDialog.isOpen, confirmDialog.displayTime]);
  
  const getConfirmationMessage = () => {
    switch (confirmDialog.action) {
      case 'taken':
        return (
            <>
            Confirmez <span className="text-primary font-semibold">l'heure de prise </span>de ce médicament
            </>
               );
      case 'taken_now':
        const currentTime = format(new Date(), 'HH:mm');
        return (
            <>
            Confirmez la prise de ce médicament<br />
            <strong>maintenant</strong> <span className="text-primary font-semibold">(il est actuellement {currentTime}) ?</span>
            </>
        );
      case 'skipped':
        return (
          <>
            Confirmez que vous avez<br />
            <span className="text-primary font-semibold">volontairement sauté</span> cette prise ?
          </>
        );
      case 'missed':
        return (
          <>
            Confirmez que vous n'avez <strong>pas pris</strong><br />
            ce médicament et <span className="text-primary font-semibold">qu'il est trop tard ?</span>
          </>
        );
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
          {confirmDialog.medicationName}{' '}
          {confirmDialog.dosage && (
            <span className="text-muted-foreground">{confirmDialog.dosage}</span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {confirmDialog.dayName} - Prévu à {confirmDialog.displayTime}
        </div>
        
        {confirmDialog.action === 'taken' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Heure de prise réelle
            </label>
            <TimePickerInput 
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
