import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DialogState {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MedicationFormData {
  name: string
  pathology: string
  posology: string
  strength: string
}

interface PathologySuggestions {
  suggestions: string[]
  showSuggestions: boolean
  onSelect: (pathology: string) => void
}

interface CustomMedicationDialogProps {
  dialog: DialogState
  formData: MedicationFormData
  pathology: PathologySuggestions
  onFieldChange: (field: keyof MedicationFormData, value: string) => void
  onSubmit: () => void
}

export const CustomMedicationDialog = ({
  dialog,
  formData,
  pathology,
  onFieldChange,
  onSubmit
}: CustomMedicationDialogProps) => {
  return (
    <Dialog open={dialog.open} onOpenChange={dialog.onOpenChange}>
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
                value={formData.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                onFocus={(e) => e.target.select()}
              onDoubleClick={(e) => e.currentTarget.select()}
                placeholder="Ex: Metformine"
              />
            </div>
            <div className="space-y-2">
              <Label>Dosage</Label>
              <Input
                id="custom-med-dosage-amount"
                value={formData.strength || ""}
                onChange={(e) => onFieldChange('strength', e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.currentTarget.select()}
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
                value={formData.pathology}
                onChange={(e) => onFieldChange('pathology', e.target.value)}
                onFocus={(e) => e.target.select()}
                onDoubleClick={(e) => e.currentTarget.select()}
                onBlur={() => {
                  // Delay to allow click on suggestion - parent component manages this
                  setTimeout(() => {}, 200);
                }}
                placeholder="Ex: Diabète"
                autoComplete="off"
              />
              {pathology.showSuggestions && pathology.suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {pathology.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => pathology.onSelect(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Posologie</Label>
              <Input
                id="custom-med-dosage"
                value={formData.posology}
                onChange={(e) => onFieldChange('posology', e.target.value)}
                onFocus={(e) => e.target.select()}
              onDoubleClick={(e) => e.currentTarget.select()}
                placeholder="Ex: 1 comprimé matin et soir"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => dialog.onOpenChange(false)}
              className="w-full"
            >
              Annuler
            </Button>
            <Button 
              type="button"
              onClick={onSubmit} 
              className="w-full"
            >
              Créer et ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
