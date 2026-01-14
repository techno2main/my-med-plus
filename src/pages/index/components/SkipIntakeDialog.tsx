import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog"
import { SkipForward, Clock, Pill, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { UpcomingIntake } from "../types"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"

interface SkipIntakeDialogProps {
  open: boolean
  intake: UpcomingIntake | null
  onConfirm: () => void
  onCancel: () => void
  processing: boolean
}

export const SkipIntakeDialog = ({ 
  open, 
  intake, 
  onConfirm, 
  onCancel, 
  processing 
}: SkipIntakeDialogProps) => {
  const [skipConfirmChecked, setSkipConfirmChecked] = useState(false)

  // Réinitialiser la checkbox quand le dialogue s'ouvre/ferme
  useEffect(() => {
    if (open) {
      setSkipConfirmChecked(false)
    }
  }, [open])

  if (!intake) return null

  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Sauter cette prise"
      description="Confirmer le saut de cette prise ?"
      confirmLabel="Confirmer le saut"
      confirmVariant="destructive"
      confirmDisabled={!skipConfirmChecked || processing}
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
            <span className="text-sm font-medium">
              Stock actuel : {intake.currentStock}
            </span>
          </div>
        </div>

        <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-3 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Cette prise sera marquée comme sautée</p>
              <p className="text-muted-foreground">
                Le stock ne sera pas décrémenté. Cette action est enregistrée dans l'historique.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-7">
            <Checkbox 
              id="skip-confirm" 
              checked={skipConfirmChecked}
              onCheckedChange={(checked) => setSkipConfirmChecked(checked === true)}
              className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <label 
              htmlFor="skip-confirm" 
              className="text-sm font-medium cursor-pointer select-none text-foreground"
            >
              Je confirme vouloir sauter cette prise
            </label>
          </div>
        </div>
      </div>
    </ConfirmDialog>
  )
}
