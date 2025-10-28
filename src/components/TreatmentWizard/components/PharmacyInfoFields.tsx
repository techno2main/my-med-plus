import { Label } from "@/components/ui/label"
import { DateInput } from "@/components/ui/date-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TreatmentFormData } from "../types"

interface PharmacyInfoFieldsProps {
  formData: TreatmentFormData
  setFormData: (data: TreatmentFormData) => void
  prescriptions: any[]
  pharmacies: any[]
}

export const PharmacyInfoFields = ({ 
  formData, 
  setFormData, 
  prescriptions, 
  pharmacies 
}: PharmacyInfoFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="prescription">Ordonnance de référence (optionnel)</Label>
        <Select
          value={formData.prescriptionId}
          onValueChange={(value) => setFormData({ ...formData, prescriptionId: value })}
        >
          <SelectTrigger className="bg-surface">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {prescriptions.length === 0 ? (
              <SelectItem value="none" disabled>
                Aucune ordonnance disponible
              </SelectItem>
            ) : (
              prescriptions.map((presc) => (
                <SelectItem key={presc.id} value={presc.id}>
                  {new Date(presc.prescription_date).toLocaleDateString('fr-FR')} - {presc.health_professionals?.name || "Médecin"}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pharmacy">Pharmacie de délivrance *</Label>
        <Select
          value={formData.pharmacyId}
          onValueChange={(value) => setFormData({ ...formData, pharmacyId: value })}
        >
          <SelectTrigger className="bg-surface">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {pharmacies.length === 0 ? (
              <SelectItem value="none" disabled>
                Aucune pharmacie disponible
              </SelectItem>
            ) : (
              pharmacies.map((pharmacy) => (
                <SelectItem key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="first-visit">Première visite en pharmacie</Label>
        <DateInput
          id="first-visit"
          value={formData.firstPharmacyVisit}
          onChange={(date) => setFormData({ ...formData, firstPharmacyVisit: date })}
          placeholder="Date"
        />
        <p className="text-xs text-muted-foreground">
          {formData.durationDays ? 
            `Les ${Math.max(0, Math.floor(parseInt(formData.durationDays) / 30) - 1)} prochaines visites seront automatiquement planifiées à 1 mois d'intervalle` :
            "Les prochaines visites seront automatiquement planifiées à 1 mois d'intervalle"
          }
        </p>
      </div>
    </>
  )
}
