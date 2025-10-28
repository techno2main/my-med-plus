import { Card } from "@/components/ui/card"
import { TreatmentFormData } from "./types"
import { BasicInfoFields } from "./components/BasicInfoFields"
import { PrescriptionUpload } from "./components/PrescriptionUpload"
import { PharmacyInfoFields } from "./components/PharmacyInfoFields"

interface Step1InfoProps {
  formData: TreatmentFormData
  setFormData: (data: TreatmentFormData) => void
  prescriptions: any[]
  doctors: any[]
  pharmacies: any[]
}

export function Step1Info({ 
  formData, 
  setFormData, 
  prescriptions, 
  doctors, 
  pharmacies 
}: Step1InfoProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 space-y-4">
        <BasicInfoFields
          formData={formData}
          setFormData={setFormData}
          doctors={doctors}
        />

        <PharmacyInfoFields
          formData={formData}
          setFormData={setFormData}
          prescriptions={prescriptions}
          pharmacies={pharmacies}
        />

        <PrescriptionUpload
          formData={formData}
          setFormData={setFormData}
        />
      </Card>
    </div>
  )
}
