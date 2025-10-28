import { Card } from "@/components/ui/card"
import { MedicationCard } from "./MedicationCard"
import type { MedicationItem } from "../types"

interface MedicationsListProps {
  medications: MedicationItem[]
  onRemove: (index: number) => void
  onUpdate: (index: number, updates: Partial<MedicationItem>) => void
  onUpdatePosology: (index: number, posology: string) => void
  onUpdateTimeSlot: (medIndex: number, timeIndex: number, value: string) => void
  onUpdateTakesPerDay: (index: number, takes: number) => void
}

export const MedicationsList = ({
  medications,
  onRemove,
  onUpdate,
  onUpdatePosology,
  onUpdateTimeSlot,
  onUpdateTakesPerDay
}: MedicationsListProps) => {
  if (medications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Aucun médicament ajouté</p>
        <p className="text-sm text-muted-foreground mt-2">
          Commencez par ajouter un médicament depuis le référentiel
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {medications.map((med, index) => (
        <MedicationCard
          key={index}
          medication={med}
          index={index}
          onRemove={onRemove}
          onUpdate={onUpdate}
          onUpdatePosology={onUpdatePosology}
          onUpdateTimeSlot={onUpdateTimeSlot}
          onUpdateTakesPerDay={onUpdateTakesPerDay}
        />
      ))}
    </div>
  )
}
