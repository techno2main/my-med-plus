import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, X } from "lucide-react"
import type { TreatmentFormData } from "../types"

interface PrescriptionUploadProps {
  formData: TreatmentFormData
  setFormData: (data: TreatmentFormData) => void
}

export const PrescriptionUpload = ({ formData, setFormData }: PrescriptionUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        prescriptionFile: file,
        prescriptionFileName: file.name,
      })
    }
  }

  const removeFile = () => {
    setFormData({
      ...formData,
      prescriptionFile: null,
      prescriptionFileName: "",
    })
  }

  return (
    <div className="space-y-2">
      <Label>Upload d&apos;ordonnance (optionnel)</Label>
      {!formData.prescriptionFile ? (
        <label htmlFor="file-upload" className="block">
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-surface">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cliquez pour uploader une ordonnance
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPEG, PNG (max 5MB)
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm flex-1 truncate">{formData.prescriptionFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-name">Nom d&apos;affichage du fichier</Label>
            <Input
              id="display-name"
              value={formData.prescriptionFileName}
              onChange={(e) => setFormData({ ...formData, prescriptionFileName: e.target.value })}
              placeholder="Ex: Ordonnance Dr. Martin - Janvier 2024"
              className="bg-surface"
            />
            <p className="text-xs text-muted-foreground">
              Ce nom sera affiché dans l&apos;application
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
