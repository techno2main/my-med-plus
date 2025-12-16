import { Card } from "@/components/ui/card"
import { MedicationCard } from "./MedicationCard"
import { useMedications } from "../contexts/MedicationsContext"

export const MedicationsList = () => {
  const { medications, handlers } = useMedications()

  if (medications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">À créer</p>
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
          data={{ medication: med, index }}
          handlers={handlers}
        />
      ))}
    </div>
  )
}
