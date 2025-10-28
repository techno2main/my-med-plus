import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TimeSelect } from "@/components/ui/time-select"
import { Trash2 } from "lucide-react"
import type { MedicationItem } from "../types"

interface MedicationCardProps {
  medication: MedicationItem
  index: number
  onRemove: (index: number) => void
  onUpdate: (index: number, updates: Partial<MedicationItem>) => void
  onUpdatePosology: (index: number, posology: string) => void
  onUpdateTimeSlot: (medIndex: number, timeIndex: number, value: string) => void
  onUpdateTakesPerDay: (index: number, takes: number) => void
}

export const MedicationCard = ({
  medication,
  index,
  onRemove,
  onUpdate,
  onUpdatePosology,
  onUpdateTimeSlot,
  onUpdateTakesPerDay
}: MedicationCardProps) => {
  return (
    <Card className="p-4 space-y-4 bg-card border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{medication.name}</h4>
            {medication.pathology && (
              <Badge variant="secondary">{medication.pathology}</Badge>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre de prises/jour</Label>
          <Input
            id={`takes-per-day-${index}`}
            type="number"
            min="1"
            value={medication.takesPerDay}
            onChange={(e) => onUpdateTakesPerDay(index, parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>Unités par prise</Label>
          <Input
            id={`units-per-take-${index}`}
            type="number"
            min="1"
            value={medication.unitsPerTake}
            onChange={(e) => onUpdate(index, { unitsPerTake: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{medication.times.length === 1 ? "Horaire de prise" : "Horaires de prise"}</Label>
        <div className="grid gap-2">
          {medication.times.map((time, timeIndex) => (
            <TimeSelect
              key={`time-${index}-${timeIndex}`}
              value={time}
              onValueChange={(value) => onUpdateTimeSlot(index, timeIndex, value)}
              className="bg-surface"
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Posologie détaillée</Label>
        <Input
          id={`dosage-${index}`}
          value={medication.posology}
          onChange={(e) => onUpdatePosology(index, e.target.value)}
          placeholder="Ex: 1 comprimé matin et soir"
          className="bg-surface"
        />
      </div>
    </Card>
  )
}
