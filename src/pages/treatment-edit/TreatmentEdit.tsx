import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTreatmentEdit } from "./hooks/useTreatmentEdit"
import { useTreatmentDelete } from "./hooks/useTreatmentDelete"
import { TreatmentInfoForm } from "./components/TreatmentInfoForm"
import { MedicationsList } from "./components/MedicationsList"
import { supabase } from "@/integrations/supabase/client"
import { ActionButtons } from "./components/ActionButtons"
import { MedicationEditDialog } from "./components/MedicationEditDialog"
import type { Medication } from "./types"

export default function TreatmentEdit() {
  const navigate = useNavigate()
  const {
    treatment,
    medications: medicationsFromDb,
    loading,
    qspDays,
    formData: formDataFromDb,
    setFormData: setFormDataDb,
    handleStartDateChange: handleStartDateChangeDb,
    handleSave,
    reloadTreatment
  } = useTreatmentEdit()

  // État local temporaire pour édition
  const [localFormData, setLocalFormData] = useState(formDataFromDb)
  const [localMedications, setLocalMedications] = useState(medicationsFromDb)

  // Sync local state quand on recharge depuis la DB
  useEffect(() => {
    setLocalFormData(formDataFromDb)
  }, [formDataFromDb])
  useEffect(() => {
    setLocalMedications(medicationsFromDb)
  }, [medicationsFromDb])

  const { deleteDialogOpen, setDeleteDialogOpen, handleDelete } = useTreatmentDelete(treatment)

  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)


  // Gestion locale des médicaments
  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med)
    setDialogOpen(true)
  }

  const handleAddMedication = () => {
    setEditingMedication(null)
    setDialogOpen(true)
  }

  // Toggle pause local
  const handleMedicationPauseToggle = (medId: string, newPaused: boolean) => {
    setLocalMedications((prev) => prev.map(m => m.id === medId ? { ...m, is_paused: newPaused } : m));
  }

  // Lorsqu'un médicament est ajouté ou modifié dans le dialog
  const handleMedicationSaved = () => {
    reloadTreatment() // recharge depuis la DB, ce qui resynchronise l'état local
  }

  const onSave = async () => {
    // Appliquer les modifications locales à la DB
    // 1. Traitement
    const success = await handleSave()
    // 2. Médicaments : appliquer les changements de pause
    for (const med of localMedications) {
      const medDb = medicationsFromDb.find(m => m.id === med.id);
      if (medDb && medDb.is_paused !== med.is_paused) {
        await supabase
          .from('medications')
          .update({ is_paused: med.is_paused })
          .eq('id', med.id);
      }
    }
    if (success) {
      reloadTreatment()
      navigate("/treatments")
    }
  }

  const onCancel = () => {
    // Réinitialiser l'état local avec les données d'origine
    setLocalFormData(formDataFromDb)
    setLocalMedications(medicationsFromDb)
    navigate("/treatments")
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    )
  }

  if (!treatment) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Traitement non trouvé</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/treatments")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Modifier le traitement</h1>
              <p className="text-sm text-muted-foreground">{treatment.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mt-4">

        <TreatmentInfoForm
          formData={localFormData}
          qspDays={qspDays}
          onFormDataChange={setLocalFormData}
          onStartDateChange={(date) => setLocalFormData(prev => ({ ...prev, startDate: date }))}
        />

        <MedicationsList
          medications={localMedications}
          onAddMedication={handleAddMedication}
          onEditMedication={handleEditMedication}
          onMedicationUpdated={reloadTreatment}
          onMedicationPauseToggle={handleMedicationPauseToggle}
        />

        <ActionButtons
          onSave={onSave}
          onCancel={onCancel}
          deleteDialogOpen={deleteDialogOpen}
          onDeleteDialogChange={setDeleteDialogOpen}
          onDelete={handleDelete}
        />

        <MedicationEditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          medication={editingMedication}
          treatmentId={treatment.id}
          onSave={handleMedicationSaved}
        />
        </div>
      </div>
    </AppLayout>
  )
}
