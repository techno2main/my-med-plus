export interface ExportConfig {
  includeProfile: boolean;
  includeAdherence: boolean;
  includeTreatments: boolean;
  includePrescriptions: boolean;
  includeIntakeHistory: boolean;
  includeStocks: boolean;
  startDate: string | null;
  endDate: string | null;
  format: 'pdf' | 'json';
}

export interface ExportData {
  profile?: ProfileData;
  adherence?: AdherenceData;
  treatments?: TreatmentData[];
  prescriptions?: PrescriptionData[];
  intakeHistory?: IntakeHistoryData[];
  stocks?: StockData[];
  exportDate: string;
  period: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  phone?: string;
}

export interface AdherenceData {
  takenOnTime: number;
  lateIntakes: number;
  skipped: number;
  adherence7Days: number;
  adherence30Days: number;
  total7Days: number;
  total30Days: number;
}

export interface TreatmentData {
  id: string;
  name: string;
  description?: string;
  pathology?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  medications: MedicationData[];
  prescriptionInfo?: {
    prescriptionDate: string;
    doctorName?: string;
  };
}

export interface MedicationData {
  name: string;
  dosage: string;
  times: string[];
  currentStock?: number;
  minThreshold?: number;
}

export interface PrescriptionData {
  id: string;
  prescriptionDate: string;
  durationDays: number;
  doctorName?: string;
  fileName?: string;
  treatments: string[];
}

export interface IntakeHistoryData {
  date: string;
  medicationName: string;
  scheduledTime: string;
  takenAt?: string;
  status: string;
  treatmentName: string;
}

export interface StockData {
  medicationName: string;
  currentStock: number;
  minThreshold: number;
  status: 'ok' | 'low' | 'critical';
  treatmentName: string;
}
