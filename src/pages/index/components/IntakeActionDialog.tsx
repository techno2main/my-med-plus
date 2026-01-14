import { ConfirmDialog } from "@/components/ui/organisms/ConfirmDialog"
import { CheckCircle2, SkipForward, Clock, Pill, ClockArrowUp } from "lucide-react"
import { format, parse, addMinutes } from "date-fns"
import { fr } from "date-fns/locale"
import { UpcomingIntake } from "../types"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimePickerInput } from "@/components/ui/time-picker-dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface IntakeActionDialogProps {
  open: boolean
  intake: UpcomingIntake | null
  onConfirmIntake: () => void
  onSkipIntake: () => void
  onPostponeIntake?: (minutes: number) => void
  onCancel: () => void
}

export const IntakeActionDialog = ({ 
  open, 
  intake, 
  onConfirmIntake, 
  onSkipIntake,
  onPostponeIntake,
  onCancel 
}: IntakeActionDialogProps) => {
  const [showPostpone, setShowPostpone] = useState(false)
  const [postponeMode, setPostponeMode] = useState<"interval" | "time">("interval")
  const [postponeMinutes, setPostponeMinutes] = useState<string>("15")
  const [postponeTime, setPostponeTime] = useState<string>("")

  // Réinitialiser l'état quand le dialogue s'ouvre/ferme
  useEffect(() => {
    if (!open) {
      setShowPostpone(false)
      setPostponeMode("interval")
      setPostponeMinutes("15")
      setPostponeTime("")
    } else if (open && intake) {
      // Initialiser l'heure de décalage avec l'heure prévue + 15 minutes
      const scheduledDate = new Date(intake.date)
      const newTime = addMinutes(scheduledDate, 15)
      setPostponeTime(format(newTime, 'HH:mm'))
    }
  }, [open, intake])

  if (!intake) return null

  const handlePostpone = () => {
    if (!onPostponeIntake || !intake) return
    
    if (postponeMode === "interval") {
      onPostponeIntake(parseInt(postponeMinutes))
    } else {
      // Calculer la différence en minutes entre l'heure prévue et l'heure choisie
      const scheduledDate = new Date(intake.date)
      const [hours, minutes] = postponeTime.split(':').map(Number)
      const targetDate = new Date(scheduledDate)
      targetDate.setHours(hours, minutes, 0, 0)
      
      const diffMinutes = Math.round((targetDate.getTime() - scheduledDate.getTime()) / 60000)
      
      // Permettre les décalages positifs et négatifs (avancer ou reculer)
      if (diffMinutes !== 0) {
        onPostponeIntake(diffMinutes)
      }
    }
  }

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
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={onConfirmIntake}
              className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmer
            </Button>
            
            <Button 
              onClick={onSkipIntake}
              variant="outline"
              className="gap-1 border-orange-400 text-orange-500 hover:bg-orange-500/10 hover:text-orange-500"
            >
              <SkipForward className="h-4 w-4" />
              Sauter
            </Button>

            {onPostponeIntake && (
              <Button 
                onClick={() => setShowPostpone(!showPostpone)}
                variant="outline"
                className="gap-1 border-blue-400 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500"
              >
                <ClockArrowUp className="h-4 w-4" />
                Décaler
              </Button>
            )}
          </div>

          {onPostponeIntake && showPostpone && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium">
                Décaler de combien de temps ?
              </Label>
              
              <RadioGroup value={postponeMode} onValueChange={(value) => setPostponeMode(value as "interval" | "time")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interval" id="interval" />
                  <label htmlFor="interval" className="text-sm cursor-pointer">
                    Par intervalle
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="time" id="time" />
                  <label htmlFor="time" className="text-sm cursor-pointer">
                    Choisir l'heure
                  </label>
                </div>
              </RadioGroup>
              
              {postponeMode === "interval" ? (
                <Select value={postponeMinutes} onValueChange={setPostponeMinutes}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un délai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                    <SelectItem value="180">3 heures</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm">Nouvelle heure de prise</Label>
                  <TimePickerInput 
                    value={postponeTime} 
                    onValueChange={setPostponeTime}
                    placeholder="HH:MM"
                  />
                </div>
              )}
              
              <Button 
                onClick={handlePostpone}
                className="w-full"
              >
                Confirmer le décalage
              </Button>
            </div>
          )}
          
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
