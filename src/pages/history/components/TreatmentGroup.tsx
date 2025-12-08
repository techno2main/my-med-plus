import { Archive } from "lucide-react"
import { IntakeHistoryCard } from "./IntakeHistoryCard"

interface TreatmentGroupProps {
  treatment: string
  qspDays?: number | null
  isActive?: boolean
  intakes: Array<{
    id: string
    medication: string
    dosage: string
    time: string
    status: string
    takenAt?: string
    scheduledTimestamp?: string
    takenAtTimestamp?: string
  }>
}

export const TreatmentGroup = ({ treatment, qspDays, isActive = true, intakes }: TreatmentGroupProps) => {
  return (
    <div className={`space-y-2 ${!isActive ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2 px-1">
        <p className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {treatment}
        </p>
        {!isActive && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
            <Archive className="h-3 w-3" />
            Terminé
          </span>
        )}
        <p className="text-xs text-muted-foreground">
          {qspDays && `QSP : ${Math.round(qspDays / 30)} mois`}
        </p>
      </div>
      <div className="space-y-2">
        {intakes.map((intake) => (
          <IntakeHistoryCard key={intake.id} intake={intake} />
        ))}
      </div>
    </div>
  )
}
