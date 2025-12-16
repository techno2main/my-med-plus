import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Pencil, Pause } from "lucide-react"
import type { Medication } from "../types"
import { useMedicationPause } from "../hooks/useMedicationPause"

interface MedicationsListProps {
  medications: Medication[]
  onAddMedication: () => void
  onEditMedication: (medication: Medication) => void
  onMedicationUpdated: () => void
}

export const MedicationsList = ({
  medications,
  onAddMedication,
  onEditMedication,
  onMedicationUpdated
}: MedicationsListProps) => {
  const { togglePause, loading } = useMedicationPause();

  const handleTogglePause = async (med: Medication) => {
    const success = await togglePause(
      med.id,
      med.is_paused || false,
      med.name
    );
    
    if (success) {
      onMedicationUpdated();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Médicament(s)</h3>
        <Button size="icon" variant="default" onClick={onAddMedication}>
          +
        </Button>
      </div>

      <div className="space-y-3">
        {medications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun médicament</p>
        ) : (
          medications.map((med) => (
            <Card key={med.id} className="p-4 bg-surface">
              {/* Ligne 1: Nom + Dosage + Pathologie Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{med.name}</p>
                  {med.strength && (
                    <span className="text-sm text-muted-foreground">{med.strength}</span>
                  )}
                </div>
                {med.pathology && (
                  <Badge variant="secondary" className="text-xs">
                    {med.pathology}
                  </Badge>
                )}
              </div>
              
              {/* Ligne 2: Posologie + Icône Edit */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{med.posology}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onEditMedication(med)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Ligne 3: Horaires de prise + Pastilles */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {med.times.length === 1 ? "Horaire de prise" : "Horaires de prise"}
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {med.times.map((time, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium">
                      {time}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ligne 4: Toggle "En pause" */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">En pause</span>
                </div>
                <Switch
                  checked={med.is_paused || false}
                  onCheckedChange={() => handleTogglePause(med)}
                  disabled={loading}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  )
}
