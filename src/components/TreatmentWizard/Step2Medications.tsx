import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { TreatmentFormData } from "./types"
import { useStep2Medications } from "./hooks/useStep2Medications"
import { MedicationsList } from "./components/MedicationsList"
import { CatalogDialog } from "./components/CatalogDialog"
import { CustomMedicationDialog } from "./components/CustomMedicationDialog"
import { MedicationsProvider } from "./contexts/MedicationsContext"
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

interface Step2MedicationsProps {
  formData: TreatmentFormData
  setFormData: (data: TreatmentFormData) => void
}

export function Step2Medications({ formData, setFormData }: Step2MedicationsProps) {
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [existingCatalogMed, setExistingCatalogMed] = useState<any>(null)
  
  const {
    catalog,
    pathologySuggestions,
    showPathologySuggestions,
    showDialog,
    setShowDialog,
    showCustomDialog,
    setShowCustomDialog,
    newCustomMed,
    handleMedicationFieldChange,
    selectPathology,
    addMedicationFromCatalog,
    addCustomMedication,
    updateMedication,
    updateMedicationPosology,
    removeMedication,
    updateTimeSlot,
    updateTakesPerDay,
    resetCustomMed
  } = useStep2Medications(formData, setFormData, (catalogMed) => {
    setExistingCatalogMed(catalogMed)
    setShowDuplicateDialog(true)
  })

  const handleCustomDialogChange = (open: boolean) => {
    setShowCustomDialog(open)
    if (!open) {
      resetCustomMed()
    }
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

      <MedicationsProvider
        value={{
          medications: formData.medications,
          handlers: {
            onRemove: removeMedication,
            onUpdate: updateMedication,
            onUpdatePosology: updateMedicationPosology,
            onUpdateTimeSlot: updateTimeSlot,
            onUpdateTakesPerDay: updateTakesPerDay
          }
        }}
      >
        <MedicationsList />
      </MedicationsProvider>

      <CatalogDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        catalog={catalog}
        onSelect={addMedicationFromCatalog}
      />

      <CustomMedicationDialog
        dialog={{
          open: showCustomDialog,
          onOpenChange: handleCustomDialogChange
        }}
        formData={{
          name: newCustomMed.name,
          pathology: newCustomMed.pathology,
          posology: newCustomMed.posology,
          strength: newCustomMed.strength
        }}
        pathology={{
          suggestions: pathologySuggestions,
          showSuggestions: showPathologySuggestions,
          onSelect: selectPathology
        }}
        onFieldChange={handleMedicationFieldChange}
        onSubmit={addCustomMedication}
      />

      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Médicament existant</AlertDialogTitle>
            <AlertDialogDescription>
              Le médicament &quot;{existingCatalogMed?.name}&quot; existe déjà dans le catalogue.
              <br /><br />
              Voulez-vous l&apos;ajouter depuis le catalogue plutôt que d&apos;en créer un nouveau ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDuplicateDialog(false);
              }}
            >
              Créer quand même
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (existingCatalogMed) {
                  addMedicationFromCatalog(existingCatalogMed);
                  setShowCustomDialog(false);
                  resetCustomMed();
                }
                setShowDuplicateDialog(false);
              }}
            >
              Utiliser le catalogue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
