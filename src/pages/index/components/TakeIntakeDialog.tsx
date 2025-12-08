import { useState, useEffect } from "react"
import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog"
import { Pill, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { UpcomingIntake } from "../types"
import { Checkbox } from "@/components/ui/checkbox"

interface TakeIntakeDialogProps {
  open: boolean
  intake: UpcomingIntake | null
  onConfirm: () => void
  onCancel: () => void
  processing: boolean
}

export const TakeIntakeDialog = ({ open, intake, onConfirm, onCancel, processing }: TakeIntakeDialogProps) => {
  const [earlyConfirmChecked, setEarlyConfirmChecked] = useState(false)

  // Reset checkbox when dialog opens/closes or intake changes
  useEffect(() => {
    if (open) {
      setEarlyConfirmChecked(false)
    }
  }, [open, intake?.id])

  const getStockColor = () => {
    if (!intake) return "";
    if (intake.currentStock === 0) return "text-red-500";
    if (intake.minThreshold !== undefined && intake.currentStock <= intake.minThreshold) {
      return "text-orange-500";
    }
    return "";
  };

  // Vérifie si l'heure actuelle est antérieure à l'heure de prise prévue
  const isBeforeScheduledTime = () => {
    if (!intake) return false;
    const now = new Date();
    return now < intake.date;
  };

  const isEarly = isBeforeScheduledTime();

  // Le bouton de confirmation n'est actif que si:
  // - La prise n'est pas anticipée, OU
  // - La prise est anticipée ET la checkbox est cochée
  const canConfirm = !isEarly || earlyConfirmChecked;

  if (!intake) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Confirmer la prise"
      description="Valider la prise de ce médicament ?"
      confirmLabel="Valider"
      confirmDisabled={!canConfirm}
    >
      <div className="space-y-3">
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

        {/* Avertissement si prise anticipée */}
        {isEarly && (
          <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-3 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Vous êtes sur le point de confirmer cette prise <strong className="text-orange-400">avant l'heure prévue</strong>. 
                Êtes-vous sûr de vouloir continuer ?
              </p>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <Checkbox 
                id="early-confirm" 
                checked={earlyConfirmChecked}
                onCheckedChange={(checked) => setEarlyConfirmChecked(checked === true)}
                className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <label 
                htmlFor="early-confirm" 
                className="text-sm font-medium cursor-pointer select-none text-foreground"
              >
                Je confirme vouloir valider cette prise en avance
              </label>
            </div>
          </div>
        )}
      </div>
    </ConfirmDialog>
  )
}
