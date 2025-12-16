interface Treatment {
  id: string
  name: string
  pathology: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  prescription_id: string
  qsp_days?: number | null
  medications: Array<{
    id: string
    name: string
    posology: string
    times: string[]
    pathology: string | null
    currentStock: number
    minThreshold: number
    isPaused: boolean
  }>
  prescribing_doctor?: {
    name: string
  } | null
  prescription?: {
    file_path: string | null
    original_filename?: string | null
  } | null
  next_pharmacy_visit?: {
    visit_date: string
    visit_number: number
  } | null
}

export type { Treatment }
