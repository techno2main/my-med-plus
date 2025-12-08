import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Pill, CheckCircle2, XCircle, ClockAlert, SkipForward } from "lucide-react"
import { format } from "date-fns"
import { isIntakeValidationAllowed, getLocalDateString } from "@/lib/dateUtils"
import { UpcomingIntake } from "../types"

interface IntakeCardProps {
  intake: UpcomingIntake
  isOverdue: boolean
  isTomorrowSection?: boolean
  onTake: (intake: UpcomingIntake) => void
}

const getStockColor = (stock: number, threshold: number) => {
  if (stock === 0) return "text-danger"
  if (stock <= threshold) return "text-warning"
  return "text-success"
}

const getStockBgColor = (stock: number, threshold: number) => {
  if (stock === 0) return "bg-danger/10"
  if (stock <= threshold) return "bg-warning/10"
  return "bg-success/10"
}

const getButtonClasses = (
  stock: number, 
  threshold: number, 
  isOverdue: boolean,
  isDisabledByTime: boolean,
  isTomorrowSection: boolean,
  isTaken: boolean
) => {
  // Si pris ou désactivé par l'heure ou section demain - utiliser bg solide au lieu de gradient pour meilleure visibilité
  if (isTaken || isTomorrowSection || isDisabledByTime) {
    return "bg-primary/60 text-white h-8 w-8 p-0 cursor-not-allowed"
  }
  
  // Si en retard
  if (isOverdue) {
    return "bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
  }
  
  // Couleurs selon le stock
  if (stock === 0) {
    return "bg-red-500 hover:bg-red-600 text-white h-8 w-8 p-0"
  }
  if (stock <= threshold) {
    return "bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
  }
  
  // OK : garder le bleu (gradient-primary)
  return "gradient-primary h-8 w-8 p-0"
}

// Icône de statut basée sur le statut de la prise (comme dans l'historique)
// Calcul du retard basé sur la différence entre heure prévue et heure de prise
const getStatusBadge = (
  status: string,
  isOverdue: boolean,
  scheduledTime: Date,
  takenAt?: Date | null
) => {
  // Prise effectuée - vérifier si en retard
  if (status === 'taken') {
    if (takenAt && scheduledTime) {
      const differenceMinutes = (takenAt.getTime() - scheduledTime.getTime()) / (1000 * 60)
      
      // Plus de 30 minutes de retard = icône ClockAlert verte
      if (differenceMinutes > 30) {
        return <ClockAlert className="h-6 w-6 text-success" />
      }
    }
    // À l'heure ou moins de 30 min de retard = CheckCircle2 vert
    return <CheckCircle2 className="h-6 w-6 text-success" />
  }
  
  // Prise sautée volontairement
  if (status === 'skipped') {
    return <SkipForward className="h-6 w-6 text-orange-500" />
  }
  
  // Prise manquée
  if (status === 'missed') {
    return <XCircle className="h-6 w-6 text-danger" />
  }
  
  // Prise en attente mais en retard
  if (status === 'pending' && isOverdue) {
    return <ClockAlert className="h-6 w-6 text-warning" />
  }
  
  // Prise en attente (à venir)
  if (status === 'pending') {
    return <Clock className="h-6 w-6 text-primary" />
  }
  
  return null
}

export const IntakeCard = ({ intake, isOverdue, isTomorrowSection = false, onTake }: IntakeCardProps) => {
  // Vérifier si c'est aujourd'hui et si l'heure de validation est autorisée
  const isToday = getLocalDateString(intake.date) === getLocalDateString(new Date())
  const isValidationAllowed = isIntakeValidationAllowed()
  const isDisabledByTime = isToday && !isValidationAllowed && !isTomorrowSection
  const isTaken = intake.status === 'taken'
  const isMissed = intake.status === 'missed' || intake.status === 'skipped'
  const isDisabled = intake.currentStock === 0 || isOverdue || isTomorrowSection || isDisabledByTime || isTaken || isMissed
  
  // Badge horaire : orange uniquement pour rattrapage (isOverdue et pas encore pris)
  const shouldShowOrangeBadge = isOverdue && !isTaken && !isMissed

  // Détermine si la prise a été faite en retard (>30 min)
  const isTakenLate = isTaken && intake.takenAt && 
    ((intake.takenAt.getTime() - intake.date.getTime()) / (1000 * 60) > 30)

  // Icône à afficher à gauche selon le statut
  const getLeftIcon = () => {
    if (isTaken) {
      // Si pris en retard, afficher ClockAlert vert
      if (isTakenLate) {
        return <ClockAlert className="h-3.5 w-3.5 mb-0.5 text-success" />
      }
      // Sinon CheckCircle2 vert
      return <CheckCircle2 className="h-3.5 w-3.5 mb-0.5 text-success" />
    }
    // Si sauté, afficher SkipForward orange
    if (intake.status === 'skipped') {
      return <SkipForward className="h-3.5 w-3.5 mb-0.5 text-orange-500" />
    }
    // Pour les autres cas, afficher Clock
    return <Clock className={`h-3.5 w-3.5 mb-0.5 ${shouldShowOrangeBadge ? 'text-orange-600' : 'text-primary'}`} />
  }

  // Couleur de fond du badge horaire
  const getTimeBadgeBgColor = () => {
    if (isTaken) return 'bg-success/10'
    if (intake.status === 'skipped') return 'bg-orange-100'
    if (shouldShowOrangeBadge) return 'bg-orange-100'
    return 'bg-primary/10'
  }

  // Couleur du texte de l'heure
  const getTimeTextColor = () => {
    if (isTaken) return 'text-success'
    if (intake.status === 'skipped') return 'text-orange-500'
    if (shouldShowOrangeBadge) return 'text-orange-700'
    return 'text-primary'
  }
  
  return (
    <Card className="p-3 surface-elevated hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg ${getTimeBadgeBgColor()}`}>
          {getLeftIcon()}
          <span className={`text-xs font-semibold ${getTimeTextColor()}`}>{intake.time}</span>
          <span className="text-[10px] text-muted-foreground">{format(intake.date, "dd/MM")}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{intake.medication}</p>
            <span className="text-xs text-muted-foreground flex-shrink-0">{intake.dosage}</span>
          </div>
          {intake.pathology && (
            <p className="text-xs text-muted-foreground truncate">{intake.pathology}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(intake.currentStock, intake.minThreshold)}`}>
            <Pill className={`h-3 w-3 ${getStockColor(intake.currentStock, intake.minThreshold)}`} />
            <span className={`text-xs font-semibold ${getStockColor(intake.currentStock, intake.minThreshold)}`}>
              {intake.currentStock}
            </span>
          </div>
          
          {/* Afficher l'icône de statut si pris/manqué, sinon le bouton d'action */}
          {isTaken ? (
            <div className="flex flex-col items-center">
              {getStatusBadge(intake.status, isOverdue, intake.date, intake.takenAt)}
              {intake.takenAt && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {format(intake.takenAt, "HH:mm")}
                </span>
              )}
            </div>
          ) : isMissed ? (
            getStatusBadge(intake.status, isOverdue, intake.date, intake.takenAt)
          ) : (
            <Button 
              size="sm" 
              className={getButtonClasses(
                intake.currentStock,
                intake.minThreshold,
                isOverdue,
                isDisabledByTime,
                isTomorrowSection,
                isTaken
              )}
              onClick={() => onTake(intake)}
              disabled={isDisabled}
            >
              {isOverdue ? (
                <ClockAlert className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
