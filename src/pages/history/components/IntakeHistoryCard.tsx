import { Pill, Pause } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusIcon, calculateIntakeStatus } from "@/components/ui/status-icon"

interface IntakeHistoryCardProps {
  intake: {
    id: string
    medication: string
    dosage: string
    time: string
    status: string
    takenAt?: string
    scheduledTimestamp?: string
    takenAtTimestamp?: string
    isPaused?: boolean
  }
}

export const IntakeHistoryCard = ({ intake }: IntakeHistoryCardProps) => {
  const calculatedStatus = calculateIntakeStatus(
    intake.status,
    intake.scheduledTimestamp,
    intake.takenAtTimestamp
  )
  
  // Vérifier si la prise est dans le futur (ou aujourd'hui pas encore prise)
  const isFutureOrToday = intake.scheduledTimestamp 
    ? new Date(intake.scheduledTimestamp) >= new Date(new Date().setHours(0, 0, 0, 0))
    : false;
  
  // Afficher pause seulement si : en pause + pending + date future/aujourd'hui
  const shouldShowPause = intake.isPaused && intake.status === 'pending' && isFutureOrToday;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
      <div className="flex items-center gap-3 flex-1">
        {shouldShowPause ? (
          <Pause className="h-5 w-5 text-orange-600" />
        ) : (
          <Pill className="h-5 w-5 text-white" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{intake.medication}</p>
            {intake.dosage && <span className="text-xs text-muted-foreground">{intake.dosage}</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            Prévu à {intake.time}
            {intake.takenAt && ` • Pris à ${intake.takenAt}`}
          </p>
        </div>
      </div>
      {shouldShowPause ? (
        <Pause className="h-6 w-6 text-orange-600" />
      ) : (
        <StatusIcon status={calculatedStatus} size="lg" />
      )}
    </div>
  )
}
