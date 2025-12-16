interface Medication {
  id: string;
  name: string;
  posology: string;
  strength?: string | null;
  times: string[];
  catalog_id?: string;
  pathology?: string | null;
  is_paused?: boolean;
}

interface Treatment {
  id: string;
  name: string;
  pathology: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  description: string | null;
}

interface TreatmentFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type { Medication, Treatment, TreatmentFormData }
