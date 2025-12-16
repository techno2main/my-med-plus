import { createContext, useContext, ReactNode } from "react"
import type { MedicationItem } from "../types"

interface MedicationsContextValue {
  medications: MedicationItem[]
  handlers: {
    onRemove: (index: number) => void
    onUpdate: (index: number, updates: Partial<MedicationItem>) => void
    onUpdatePosology: (index: number, posology: string) => void
    onUpdateTimeSlot: (medIndex: number, timeIndex: number, value: string) => void
    onUpdateTakesPerDay: (index: number, takes: number) => void
  }
}

const MedicationsContext = createContext<MedicationsContextValue | undefined>(undefined)

interface MedicationsProviderProps {
  value: MedicationsContextValue
  children: ReactNode
}

export function MedicationsProvider({ value, children }: MedicationsProviderProps) {
  return (
    <MedicationsContext.Provider value={value}>
      {children}
    </MedicationsContext.Provider>
  )
}

export function useMedications() {
  const context = useContext(MedicationsContext)
  if (!context) {
    throw new Error("useMedications must be used within MedicationsProvider")
  }
  return context
}
