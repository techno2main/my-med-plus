import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog"
import { Pill, Clock } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { UpcomingIntake } from "../types"

interface TakeIntakeDialogProps {
  open: boolean
  intake: UpcomingIntake | null
  onConfirm: () => void
  onCancel: () => void
  processing: boolean
}

export const TakeIntakeDialog = ({ open, intake, onConfirm, onCancel, processing }: TakeIntakeDialogProps) => {
  const getStockColor = () => {
    if (!intake) return "";
    if (intake.currentStock === 0) return "text-red-500";
    if (intake.minThreshold !== undefined && intake.currentStock <= intake.minThreshold) {
      return "text-orange-500";
    }
    return "";
  };

  if (!intake) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Confirmer la prise"
      description="Valider la prise de ce médicament ?"
      confirmLabel="Valider"
    >
      <div className="bg-card border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{intake.medication}</h4>
          <span className="text-sm font-medium text-muted-foreground">{intake.dosage}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Prévu à {intake.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Maintenant : {format(new Date(), 'HH:mm', { locale: fr })}</span>
          </div>
        </div>
        {intake.pathology && (
          <p className="text-sm text-muted-foreground">
            Traitement : {intake.pathology}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <span className={`text-sm font-medium ${getStockColor()}`}>
            Stock actuel : {intake.currentStock}
          </span>
        </div>
      </div>
    </ConfirmDialog>
  )
}
