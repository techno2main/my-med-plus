import { forwardRef } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { TreatmentAccordion } from "./TreatmentAccordion"
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils"
import { getLocalDateString } from "@/lib/dateUtils"
import { UpcomingIntake } from "../types"

interface TomorrowSectionProps {
  intakes: UpcomingIntake[]
  openAccordions: string[]
  onValueChange: (value: string[]) => void
  isOverdue: (date: Date) => boolean
  onTakeIntake: (intake: UpcomingIntake) => void
}

export const TomorrowSection = forwardRef<HTMLDivElement, TomorrowSectionProps>(
  ({ intakes, openAccordions, onValueChange, isOverdue, onTakeIntake }, ref) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDateString = getLocalDateString(tomorrow)
    
    const tomorrowIntakes = intakes.filter(intake => {
      const intakeDateString = getLocalDateString(intake.date)
      return intakeDateString === tomorrowDateString
    })
    
    if (tomorrowIntakes.length === 0) return null
    
    // Group by treatment
    const groupedByTreatment = tomorrowIntakes.reduce((acc, intake) => {
      if (!acc[intake.treatmentId]) {
        acc[intake.treatmentId] = {
          treatment: intake.treatment,
          qspDays: intake.treatmentQspDays,
          endDate: intake.treatmentEndDate,
          intakes: []
        }
      }
      acc[intake.treatmentId].intakes.push(intake)
      return acc
    }, {} as Record<string, { treatment: string; qspDays?: number | null; endDate?: string | null; intakes: UpcomingIntake[] }>)

    // Sort intakes within each treatment
    Object.values(groupedByTreatment).forEach(group => {
      group.intakes = sortIntakesByTimeAndName(group.intakes)
    })

    return (
      <div className="space-y-3" ref={ref}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Demain
          </h3>
          <span className="text-xs text-muted-foreground/60">
            {format(tomorrow, "dd/MM/yyyy", { locale: fr })}
          </span>
        </div>
        <TreatmentAccordion
          groups={groupedByTreatment}
          openAccordions={openAccordions}
          onValueChange={onValueChange}
          sectionPrefix="tomorrow"
          isOverdue={isOverdue}
          onTakeIntake={onTakeIntake}
        />
      </div>
    )
  }
)

TomorrowSection.displayName = "TomorrowSection"
