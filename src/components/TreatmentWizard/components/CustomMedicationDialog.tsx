import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CustomMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newMedication: {
    name: string
    pathology: string
    posology: string
    strength: string
  }
  onMedicationChange: (field: string, value: string) => void
  onPathologyChange: (value: string) => void
  pathologySuggestions: string[]
  showSuggestions: boolean
  onSelectPathology: (pathology: string) => void
  onSubmit: () => void
}

export const CustomMedicationDialog = ({
  open,
  onOpenChange,
  newMedication,
  onMedicationChange,
  onPathologyChange,
  pathologySuggestions,
  showSuggestions,
  onSelectPathology,
  onSubmit
}: CustomMedicationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un nouveau médicament</DialogTitle>
          <DialogDescription>
            Ajouter un médicament au catalogue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Première ligne : Nom du médicament + Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom du médicament *</Label>
              <Input
                id="custom-med-name"
                value={newMedication.name}
                onChange={(e) => onMedicationChange('name', e.target.value)}
                placeholder="Ex: Metformine"
              />
            </div>
            <div className="space-y-2">
              <Label>Dosage</Label>
              <Input
                id="custom-med-dosage-amount"
                value={newMedication.strength || ""}
                onChange={(e) => onMedicationChange('strength', e.target.value)}
                placeholder="Ex: 850mg"
              />
            </div>
          </div>
          
          {/* Deuxième ligne : Pathologie + Posologie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label>Pathologie</Label>
              <Input
                id="custom-med-pathology"
                value={newMedication.pathology}
                onChange={(e) => onPathologyChange(e.target.value)}
                onFocus={() => {
                  if (newMedication.pathology.trim().length > 0 && pathologySuggestions.length > 0) {
                    // Handle focus - parent component manages this
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion - parent component manages this
                  setTimeout(() => {}, 200);
                }}
                placeholder="Ex: Diabète"
                autoComplete="off"
              />
              {showSuggestions && pathologySuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {pathologySuggestions.map((pathology, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => onSelectPathology(pathology)}
                    >
                      {pathology}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Posologie</Label>
              <Input
                id="custom-med-dosage"
                value={newMedication.posology}
                onChange={(e) => onMedicationChange('posology', e.target.value)}
                placeholder="Ex: 1 comprimé matin et soir"
              />
            </div>
          </div>
          <Button onClick={onSubmit} className="w-full">
            Créer et ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
