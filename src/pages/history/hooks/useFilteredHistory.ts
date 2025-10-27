import { useMemo } from "react"
import { parseISO } from "date-fns"
import { GroupedIntakes, FilterStatus } from "../types"

export const useFilteredHistory = (historyData: GroupedIntakes[], filterStatus: FilterStatus) => {
  const filteredData = useMemo(() => {
    if (filterStatus === "all") return historyData

    return historyData.map(day => ({
      ...day,
      intakes: day.intakes.filter(intake => {
        if (filterStatus === "missed") {
          return intake.status === 'skipped'
        }

        // For ontime and late filters, check if taken
        if (intake.status !== 'taken' || !intake.scheduledTimestamp || !intake.takenAtTimestamp) {
          return false
        }

        const scheduledTime = parseISO(intake.scheduledTimestamp)
        const takenTime = parseISO(intake.takenAtTimestamp)
        const delayMinutes = (takenTime.getTime() - scheduledTime.getTime()) / (1000 * 60)

        if (filterStatus === "ontime") {
          return delayMinutes <= 30
        }

        if (filterStatus === "late") {
          return delayMinutes > 30
        }

        return false
      })
    })).filter(day => day.intakes.length > 0)
  }, [historyData, filterStatus])

  return filteredData
}
