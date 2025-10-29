export interface DayIntake {
  date: Date;
  total: number;
  taken: number;
  missed: number;
  upcoming: number;
}

export interface IntakeDetail {
  id: string;
  medication: string;
  dosage: string;
  time: string;
  takenAt?: string;
  status: 'taken' | 'missed' | 'upcoming';
  treatment: string;
  scheduledTimestamp?: string;
  takenAtTimestamp?: string;
  currentStock?: number;
  minThreshold?: number;
}

export interface VisitDates {
  nextPharmacyVisit: Date | null;
  nextDoctorVisit: Date | null;
  treatmentStartDate: Date | null;
}
