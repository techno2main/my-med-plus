import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog"
import { CheckCircle2, SkipForward, Clock, Pill } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { UpcomingIntake } from "../types"
import { Button } from "@/components/ui/button"

interface IntakeActionDialogProps {
  open: boolean
  intake: UpcomingIntake | null
  onConfirmIntake: () => void
  onSkipIntake: () => void
  onCancel: () => void
}

export const IntakeActionDialog = ({ 
  open, 
  intake, 
  onConfirmIntake, 
  onSkipIntake, 
  onCancel 
}: IntakeActionDialogProps) => {
  if (!intake) return null

  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={() => {}} // Not used - we have custom buttons
      title="Action sur la prise"
      description="Que souhaitez-vous faire pour cette prise ?"
      showFooter={false}
    >
      <div className="space-y-4">
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

        <div className="flex flex-col gap-3">
          <Button 
            onClick={onConfirmIntake}
            className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground"
          >
            <CheckCircle2 className="h-5 w-5" />
            Confirmer la prise
          </Button>
          
          <Button 
            onClick={onSkipIntake}
            variant="outline"
            className="w-full gap-2 border-orange-400 text-orange-500 hover:bg-orange-500/10 hover:text-orange-500"
          >
            <SkipForward className="h-5 w-5" />
            Sauter cette prise
          </Button>
          
          <Button 
            onClick={onCancel}
            variant="ghost"
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </div>
    </ConfirmDialog>
  )
}
