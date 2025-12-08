import { Pill } from "lucide-react"
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
  }
}

export const IntakeHistoryCard = ({ intake }: IntakeHistoryCardProps) => {
  const calculatedStatus = calculateIntakeStatus(
    intake.status,
    intake.scheduledTimestamp,
    intake.takenAtTimestamp
  )
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
      <div className="flex items-center gap-3 flex-1">
        <Pill className="h-5 w-5 text-white" />
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
      <StatusIcon status={calculatedStatus} size="lg" />
    </div>
  )
}
