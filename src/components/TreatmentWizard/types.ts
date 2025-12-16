export interface TreatmentFormData {
  // Step 1
  name: string;
  description: string;
  prescribingDoctorId: string;
  prescriptionId: string;
  prescriptionDate: string;
  startDate: string;
  durationDays: string;
  qsp: string;
  prescriptionFile: File | null;
  prescriptionFileName: string;
  pharmacyId: string;
  firstPharmacyVisit: string;
  
  // Step 2
  medications: MedicationItem[];
  
  // Step 3
  stocks: Record<string, number>;
}

export interface MedicationItem {
  catalogId?: string;
  name: string;
  pathology: string;
  posology: string;
  takesPerDay: number;
  times: string[];
  unitsPerTake: number;
  minThreshold: number;
  isCustom?: boolean;
  strength?: string;
  // Données temporaires pour médicaments personnalisés (avant insertion en base)
  pendingPathology?: string;
  pendingInsertion?: boolean;
}

export interface CatalogMedication {
  id: string;
  name: string;
  pathology: string;
  default_posology: string;
  strength?: string | null;
  description: string;
  default_times?: string[] | null;
}
