import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { IntakeCard } from "./IntakeCard"
import { UpcomingIntake } from "../types"

interface TreatmentGroup {
  treatment: string
  qspDays?: number | null
  endDate?: string | null
  intakes: UpcomingIntake[]
}

interface TreatmentAccordionProps {
  groups: Record<string, TreatmentGroup>
  openAccordions: string[]
  onValueChange: (value: string[]) => void
  sectionPrefix: 'today' | 'tomorrow'
  isOverdue: (date: Date) => boolean
  onTakeIntake: (intake: UpcomingIntake) => void
}

export const TreatmentAccordion = ({ 
  groups, 
  openAccordions, 
  onValueChange, 
  sectionPrefix,
  isOverdue,
  onTakeIntake 
}: TreatmentAccordionProps) => {
  const isTomorrowSection = sectionPrefix === 'tomorrow'

  return (
    <Accordion 
      type="multiple" 
      className="space-y-2"
      value={openAccordions}
      onValueChange={onValueChange}
    >
      {Object.entries(groups).map(([treatmentId, group]) => (
        <AccordionItem key={`${sectionPrefix}-${treatmentId}`} value={`${sectionPrefix}-${treatmentId}`} className="border-none">
          <AccordionTrigger className="hover:no-underline py-2 px-1">
            <div className="flex items-baseline gap-2 text-left">
              <p className="text-xs font-medium text-primary">
                {group.treatment}
              </p>
              <p className="text-xs text-muted-foreground">
                {group.qspDays && `QSP : ${Math.round(group.qspDays / 30)} mois`}
                {group.endDate && ` • Fin : ${new Date(group.endDate).toLocaleDateString("fr-FR")}`}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 pb-2">
            {group.intakes.map((intake) => (
              <IntakeCard
                key={intake.id}
                intake={intake}
                isOverdue={isOverdue(intake.date)}
                isTomorrowSection={isTomorrowSection}
                onTake={onTakeIntake}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
