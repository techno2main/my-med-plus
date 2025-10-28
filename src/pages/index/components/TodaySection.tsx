import { forwardRef } from "react"
import { TreatmentAccordion } from "./TreatmentAccordion"
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils"
import { UpcomingIntake } from "../types"

interface TodaySectionProps {
  intakes: UpcomingIntake[]
  openAccordions: string[]
  onValueChange: (value: string[]) => void
  isOverdue: (date: Date) => boolean
  onTakeIntake: (intake: UpcomingIntake) => void
}

export const TodaySection = forwardRef<HTMLDivElement, TodaySectionProps>(
  ({ intakes, openAccordions, onValueChange, isOverdue, onTakeIntake }, ref) => {
    const today = new Date()
    const todayDateString = today.toISOString().split('T')[0]
    
    const todayIntakes = intakes.filter(intake => {
      const intakeDateString = intake.date.toISOString().split('T')[0]
      return intakeDateString === todayDateString
    })
    
    if (todayIntakes.length === 0) return null
    
    // Group by treatment
    const groupedByTreatment = todayIntakes.reduce((acc, intake) => {
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
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Aujourd'hui
        </h3>
        <TreatmentAccordion
          groups={groupedByTreatment}
          openAccordions={openAccordions}
          onValueChange={onValueChange}
          sectionPrefix="today"
          isOverdue={isOverdue}
          onTakeIntake={onTakeIntake}
        />
      </div>
    )
  }
)

TodaySection.displayName = "TodaySection"
