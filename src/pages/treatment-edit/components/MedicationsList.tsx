import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Pencil, Pause, Trash2, CheckCircle2 } from "lucide-react"
import clsx from "clsx"
import type { Medication } from "../types"
import { useMedicationPause } from "../hooks/useMedicationPause"
import { useMedicationDelete } from "../hooks/useMedicationDelete"
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
import { useState } from "react"

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
  const { deleteMedication, loading: deleteLoading } = useMedicationDelete();
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);

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

  const handleDeleteConfirm = async () => {
    if (!medicationToDelete) return;
    
    const success = await deleteMedication(medicationToDelete.id, medicationToDelete.name);
    
    if (success) {
      setMedicationToDelete(null);
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
              
              {/* Ligne 2: Posologie + Icône Edit + Icône Delete */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{med.posology}</p>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onEditMedication(med)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setMedicationToDelete(med)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
                  {med.is_paused ? (
                    <Pause className="h-4 w-4 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <span className={clsx("text-sm", med.is_paused ? "text-orange-500" : "text-green-500") }>
                    {med.is_paused ? "Médicament en pause" : "Médicament actif"}
                  </span>
                </div>
                <button
                  type="button"
                  aria-pressed={med.is_paused}
                  onClick={() => handleTogglePause(med)}
                  disabled={loading}
                  className={clsx(
                    "relative w-8 h-5 flex items-center rounded-full transition-colors focus:outline-none border-2",
                    med.is_paused ? "bg-orange-100 border-orange-400" : "bg-green-100 border-green-400"
                  )}
                >
                  <span
                    className={clsx(
                      "flex items-center justify-center w-4 h-4 rounded-full shadow-md transform transition-transform",
                      med.is_paused ? "translate-x-3 bg-orange-500" : "translate-x-0 bg-green-500"
                    )}
                  >
                    {med.is_paused ? (
                      <Pause className="h-3 w-3 text-white" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </span>
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!medicationToDelete} onOpenChange={(open) => !open && setMedicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce médicament ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{medicationToDelete?.name}</strong> de ce traitement ?
              Toutes les prises associées seront également supprimées. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
