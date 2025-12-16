import { useState } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTreatmentEdit } from "./hooks/useTreatmentEdit"
import { useTreatmentDelete } from "./hooks/useTreatmentDelete"
import { TreatmentInfoForm } from "./components/TreatmentInfoForm"
import { MedicationsList } from "./components/MedicationsList"
import { ActionButtons } from "./components/ActionButtons"
import { MedicationEditDialog } from "./components/MedicationEditDialog"
import type { Medication } from "./types"

export default function TreatmentEdit() {
  const navigate = useNavigate()
  const {
    treatment,
    medications,
    loading,
    qspDays,
    formData,
    setFormData,
    handleStartDateChange,
    handleSave,
    reloadTreatment
  } = useTreatmentEdit()

  const { deleteDialogOpen, setDeleteDialogOpen, handleDelete } = useTreatmentDelete(treatment)

  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med)
    setDialogOpen(true)
  }

  const handleAddMedication = () => {
    setEditingMedication(null)
    setDialogOpen(true)
  }

  const handleMedicationSaved = () => {
    reloadTreatment()
  }

  const onSave = async () => {
    const success = await handleSave()
    if (success) {
      navigate("/treatments")
    }
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
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/treatments")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Modifier le traitement</h1>
            <p className="text-muted-foreground">{treatment.name}</p>
          </div>
        </div>

        <TreatmentInfoForm
          formData={formData}
          qspDays={qspDays}
          onFormDataChange={setFormData}
          onStartDateChange={handleStartDateChange}
        />

        <MedicationsList
          medications={medications}
          onAddMedication={handleAddMedication}
          onEditMedication={handleEditMedication}
          onMedicationUpdated={reloadTreatment}
        />

        <ActionButtons
          onSave={onSave}
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
    </AppLayout>
  )
}
