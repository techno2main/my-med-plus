import { forwardRef } from "react"
import { Card } from "@/components/ui/card"
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react"
import { format, isToday } from "date-fns"
import { fr } from 'date-fns/locale'
import { TreatmentGroup } from "./TreatmentGroup"

interface DaySectionProps {
  day: {
    date: Date
    intakes: Array<{
      id: string
      medication: string
      dosage: string
      time: string
      status: string
      takenAt?: string
      scheduledTimestamp?: string
      takenAtTimestamp?: string
      treatment: string
      treatmentId: string
      treatmentQspDays?: number | null
      treatmentEndDate?: string | null
      treatmentIsActive?: boolean
    }>
  }
  isExpanded: boolean
  onToggle: () => void
}

export const DaySection = forwardRef<HTMLDivElement, DaySectionProps>(
  ({ day, isExpanded, onToggle }, ref) => {
    const isTodaySection = isToday(day.date)

    // Group intakes by treatment
    const groupedByTreatment = day.intakes.reduce((acc, intake) => {
      if (!acc[intake.treatmentId]) {
        acc[intake.treatmentId] = {
          treatment: intake.treatment,
          qspDays: intake.treatmentQspDays,
          isActive: intake.treatmentIsActive ?? true,
          intakes: []
        }
      }
      acc[intake.treatmentId].intakes.push(intake)
      return acc
    }, {} as Record<string, { treatment: string; qspDays?: number | null; isActive?: boolean; intakes: typeof day.intakes }>)

    return (
      <Card className="p-4" ref={ref}>
        <div 
          className={`flex items-center justify-between gap-2 mb-4 ${!isTodaySection ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
          onClick={() => !isTodaySection && onToggle()}
        >
          <div className="flex items-center gap-2 flex-1">
            <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-semibold text-sm">
              {isTodaySection ? "Aujourd'hui" : format(day.date, "EEEE d MMMM yyyy", { locale: fr })}
            </h3>
            {isTodaySection && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {format(day.date, "d MMMM yyyy", { locale: fr })}
              </span>
            )}
          </div>
          {!isTodaySection && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {Object.entries(groupedByTreatment).map(([treatmentId, group]) => (
              <TreatmentGroup
                key={treatmentId}
                treatment={group.treatment}
                qspDays={group.qspDays}
                isActive={group.isActive}
                intakes={group.intakes}
              />
            ))}
          </div>
        )}
      </Card>
    )
  }
)

DaySection.displayName = "DaySection"
