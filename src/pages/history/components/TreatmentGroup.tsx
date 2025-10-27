import { IntakeHistoryCard } from "./IntakeHistoryCard"

interface TreatmentGroupProps {
  treatment: string
  qspDays?: number | null
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

export const TreatmentGroup = ({ treatment, qspDays, intakes }: TreatmentGroupProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2 px-1">
        <p className="text-xs font-medium text-primary">
          {treatment}
        </p>
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
