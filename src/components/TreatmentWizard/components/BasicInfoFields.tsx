import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateInput } from "@/components/ui/date-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TreatmentFormData } from "../types"

interface BasicInfoFieldsProps {
  formData: TreatmentFormData
  setFormData: (data: TreatmentFormData) => void
  doctors: any[]
}

export const BasicInfoFields = ({ formData, setFormData, doctors }: BasicInfoFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="treatment-name">Nom du traitement *</Label>
        <Input
          id="treatment-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Traitement diabète type 2"
          className="bg-surface"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Informations complémentaires"
          className="bg-surface"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doctor">Médecin prescripteur *</Label>
        <Select
          value={formData.prescribingDoctorId}
          onValueChange={(value) => setFormData({ ...formData, prescribingDoctorId: value })}
        >
          <SelectTrigger className="bg-surface">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {doctors.length === 0 ? (
              <SelectItem value="none" disabled>
                Aucun médecin disponible
              </SelectItem>
            ) : (
              doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prescription-date">Début *</Label>
          <DateInput
            id="prescription-date"
            value={formData.prescriptionDate}
            onChange={(date) => setFormData({ ...formData, prescriptionDate: date })}
            placeholder="Date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration-days">QSP *</Label>
          <Input
            id="duration-days"
            type="number"
            value={formData.durationDays}
            onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
            placeholder="Ex: 30, 60, 90..."
            className="bg-surface"
            required
            min="1"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        QSP = Quantité Suffisante Pour (en jours)
      </p>
    </>
  )
}
