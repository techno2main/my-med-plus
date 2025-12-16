export interface MedicationIntake {
  id: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  status: 'pending' | 'taken' | 'skipped'
  medications: {
    name: string
    catalog_id?: string
    medication_catalog?: {
      strength?: string
      default_posology?: string
    }
  }
}

export interface GroupedIntakes {
  date: Date
  intakes: {
    id: string
    time: string
    medication: string
    dosage: string
    status: string
    takenAt?: string
    scheduledTimestamp?: string
    takenAtTimestamp?: string
    treatment: string
    treatmentId: string
    treatmentQspDays?: number | null
    treatmentEndDate?: string | null
    treatmentIsActive?: boolean
    isPaused?: boolean
  }[]
}

export type FilterStatus = 'all' | 'missed' | 'ontime' | 'late' | 'skipped'
export type ActiveTab = 'history' | 'statistics'
