import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Pill, Clock, CheckCircle2, X } from "lucide-react"
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
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Confirmer la prise
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Valider la prise de ce médicament ?
          </DialogDescription>
        </DialogHeader>
        
        {intake && (
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
                <span className="text-sm">
                  Stock actuel : <span className="font-medium">{intake.currentStock}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row gap-3 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={processing}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1 gradient-primary"
            disabled={intake?.currentStock === 0 || processing}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
