export interface UpcomingIntake {
  id: string
  medicationId: string
  medication: string
  dosage: string
  time: string
  date: Date
  treatment: string
  treatmentId: string
  pathology: string
  currentStock: number
  minThreshold: number
  treatmentQspDays?: number | null
  treatmentEndDate?: string | null
}

export interface StockAlert {
  id: string
  medication: string
  remaining: number
  daysLeft: number
}

export interface ActiveTreatment {
  id: string
  name: string
  startDate: string
  endDate: string
  qspDays: number | null
}
