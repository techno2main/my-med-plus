import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TimePickerInput } from "@/components/ui/time-picker-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import type { MedicationItem } from "../types"

interface MedicationCardData {
  medication: MedicationItem
  index: number
}

interface MedicationCardHandlers {
  onRemove: (index: number) => void
  onUpdate: (index: number, updates: Partial<MedicationItem>) => void
  onUpdatePosology: (index: number, posology: string) => void
  onUpdateTimeSlot: (medIndex: number, timeIndex: number, value: string) => void
  onUpdateTakesPerDay: (index: number, takes: number) => void
}

interface MedicationCardProps {
  data: MedicationCardData
  handlers: MedicationCardHandlers
}

export const MedicationCard = ({
  data,
  handlers
}: MedicationCardProps) => {
  const { medication, index } = data
  const { onRemove, onUpdate, onUpdatePosology, onUpdateTimeSlot, onUpdateTakesPerDay } = handlers
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
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
          onClick={() => setShowDeleteDialog(true)}
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
            onFocus={(e) => e.target.select()}
            onDoubleClick={(e) => e.currentTarget.select()}
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
            onFocus={(e) => e.target.select()}
            onDoubleClick={(e) => e.currentTarget.select()}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{medication.times.length === 1 ? "Horaire de prise" : "Horaires de prise"}</Label>
        <div className="grid gap-2">
          {medication.times.map((time, timeIndex) => (
            <TimePickerInput
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
          onFocus={(e) => e.target.select()}
          onDoubleClick={(e) => e.currentTarget.select()}
          placeholder="Ex: 1 comprimé matin et soir"
          className="bg-surface"
        />
      </div>
    </Card>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer &quot;{medication.name}&quot; de la liste des médicaments ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onRemove(index);
              setShowDeleteDialog(false);
            }}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
