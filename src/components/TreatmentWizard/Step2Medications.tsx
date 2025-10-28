import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TreatmentFormData } from "./types"
import { useStep2Medications } from "./hooks/useStep2Medications"
import { MedicationsList } from "./components/MedicationsList"
import { CatalogDialog } from "./components/CatalogDialog"
import { CustomMedicationDialog } from "./components/CustomMedicationDialog"

interface Step2MedicationsProps {
  formData: TreatmentFormData
  setFormData: (data: TreatmentFormData) => void
}

export function Step2Medications({ formData, setFormData }: Step2MedicationsProps) {
  const {
    catalog,
    pathologySuggestions,
    showPathologySuggestions,
    showDialog,
    setShowDialog,
    showCustomDialog,
    setShowCustomDialog,
    newCustomMed,
    setNewCustomMed,
    handlePathologyChange,
    selectPathology,
    addMedicationFromCatalog,
    addCustomMedication,
    updateMedication,
    updateMedicationPosology,
    removeMedication,
    updateTimeSlot,
    updateTakesPerDay
  } = useStep2Medications(formData, setFormData)

  const handleMedicationFieldChange = (field: string, value: string) => {
    setNewCustomMed({ ...newCustomMed, [field]: value })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowDialog(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomDialog(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer
        </Button>
      </div>

      <MedicationsList
        medications={formData.medications}
        onRemove={removeMedication}
        onUpdate={updateMedication}
        onUpdatePosology={updateMedicationPosology}
        onUpdateTimeSlot={updateTimeSlot}
        onUpdateTakesPerDay={updateTakesPerDay}
      />

      <CatalogDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        catalog={catalog}
        onSelect={addMedicationFromCatalog}
      />

      <CustomMedicationDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        newMedication={newCustomMed}
        onMedicationChange={handleMedicationFieldChange}
        onPathologyChange={handlePathologyChange}
        pathologySuggestions={pathologySuggestions}
        showSuggestions={showPathologySuggestions}
        onSelectPathology={selectPathology}
        onSubmit={addCustomMedication}
      />
    </div>
  )
}
