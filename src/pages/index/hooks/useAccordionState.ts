import { useState, useEffect } from "react"

export const useAccordionState = (defaultOpen: string[] = []) => {
  const [openAccordions, setOpenAccordions] = useState<string[]>(defaultOpen)

  const setDefaultOpen = (ids: string[]) => {
    setOpenAccordions(ids)
  }

  return {
    openAccordions,
    setOpenAccordions,
    setDefaultOpen
  }
}
