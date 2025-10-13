export interface TreatmentFormData {
  // Step 1
  name: string;
  description: string;
  prescriptionId: string;
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
  dosage: string;
  takesPerDay: number;
  times: string[];
  unitsPerTake: number;
  minThreshold: number;
  isCustom?: boolean;
}

export interface CatalogMedication {
  id: string;
  name: string;
  pathology: string;
  default_dosage: string;
  description: string;
}
