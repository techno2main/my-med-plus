import { Pill, CheckCircle2, XCircle, Clock, ClockAlert } from "lucide-react"

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
  }
}

const getStatusIcon = () => {
  // Toujours afficher l'icône pilule blanche
  return <Pill className="h-5 w-5 text-white" />
}

const getStatusBadge = (status: string, scheduledTimestamp?: string, takenAtTimestamp?: string) => {
  if (status === "taken" && scheduledTimestamp && takenAtTimestamp) {
    const scheduled = new Date(scheduledTimestamp)
    const taken = new Date(takenAtTimestamp)
    const differenceMinutes = (taken.getTime() - scheduled.getTime()) / (1000 * 60)
    
    // Vert : avant l'heure ou jusqu'à 30min après (à l'heure)
    if (differenceMinutes <= 30) {
      return <CheckCircle2 className="h-6 w-6 text-success" />
    }
    // Vert : entre 30min et 1h après (léger retard)
    else if (differenceMinutes <= 60) {
      return <ClockAlert className="h-6 w-6 text-success" />
    }
    // Vert : plus d'1h après (gros retard)
    else {
      return <ClockAlert className="h-6 w-6 text-success" />
    }
  }
  
  switch (status) {
    case "taken":
      return <CheckCircle2 className="h-6 w-6 text-success" />
    case "skipped":
      return <XCircle className="h-6 w-6 text-danger" />
    case "pending":
      return <Clock className="h-6 w-6 text-warning" />
    default:
      return null
  }
}

export const IntakeHistoryCard = ({ intake }: IntakeHistoryCardProps) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
      <div className="flex items-center gap-3 flex-1">
        {getStatusIcon()}
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
      {getStatusBadge(intake.status, intake.scheduledTimestamp, intake.takenAtTimestamp)}
    </div>
  )
}
