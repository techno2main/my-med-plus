import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pause, CheckCircle2 } from "lucide-react"
import clsx from "clsx"
import { DateInput } from "@/components/ui/date-input"
import { formatToFrenchDate } from "@/lib/dateUtils"
import type { TreatmentFormData } from "../types"

interface TreatmentInfoFormProps {
  formData: TreatmentFormData
  qspDays: number | null
  onFormDataChange: (formData: TreatmentFormData) => void
  onStartDateChange: (date: string) => void
}

export const TreatmentInfoForm = ({
  formData,
  qspDays,
  onFormDataChange,
  onStartDateChange
}: TreatmentInfoFormProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Ligne 1 : Nom + toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label htmlFor="name">Nom du traitement</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => onFormDataChange({...formData, name: e.target.value})}
                placeholder="Ex: Traitement Diabète"
                className="flex-1"
              />
              <button
                type="button"
                aria-pressed={formData.isActive}
                onClick={() => onFormDataChange({...formData, isActive: !formData.isActive})}
                className={clsx(
                  "relative w-8 h-5 flex items-center rounded-full transition-colors focus:outline-none border-2 ml-2",
                  formData.isActive ? "bg-green-100 border-green-400" : "bg-orange-100 border-orange-400"
                )}
              >
                <span
                  className={clsx(
                    "flex items-center justify-center w-4 h-4 rounded-full shadow-md transform transition-transform",
                    formData.isActive ? "translate-x-0 bg-green-500" : "translate-x-3 bg-orange-500"
                  )}
                >
                  {formData.isActive ? (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  ) : (
                    <Pause className="h-3 w-3 text-white" />
                  )}
                </span>
              </button>
              <span className={clsx("text-xs ml-2", formData.isActive ? "text-green-500" : "text-orange-500") }>
                {formData.isActive ? "Traitement Actif" : "Traitement en pause"}
              </span>
            </div>
          </div>
        </div>

        {/* Ligne 2 : Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Date de début</Label>
            <DateInput
              id="startDate"
              value={formData.startDate}
              onChange={onStartDateChange}
              placeholder="Non définie"
              className="bg-surface"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <div className="flex items-center h-10 px-2 py-2 rounded-md border border-input bg-muted/50 text-xs overflow-hidden">
              <span className="truncate">{formData.endDate ? formatToFrenchDate(formData.endDate) : "Non définie"}</span>
            </div>
          </div>
        </div>       

        {/* Ligne 3 : QSP/mois + nb jours */}
        <div className="flex items-center gap-2">
          {qspDays !== null && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              QSP : {Math.round(qspDays / 30)} mois ({qspDays} jours)
            </span>
          )}
        </div>

         {/* Ligne 4 : Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input 
            id="description" 
            value={formData.description}
            onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
            placeholder="Ex: Diabète Type 2, Cholestérol..."
          />
        </div>
      </div>
    </Card>
  )
}
