import { useState, useEffect, useRef } from "react"
import { isToday, startOfDay } from "date-fns"
import { GroupedIntakes, FilterStatus } from "../types"

export const useExpandedDays = (
  historyData: GroupedIntakes[], 
  filterStatus: FilterStatus,
  activeTab: string
) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const todayRef = useRef<HTMLDivElement>(null)

  // Auto-expand today's section without scrolling
  useEffect(() => {
    if (historyData.length > 0 && activeTab === "history") {
      const todayData = historyData.find(day => isToday(day.date))
      if (todayData) {
        const todayKey = todayData.date.toISOString()
        setExpandedDays(new Set([todayKey]))
      }
    }
  }, [historyData, activeTab])

  // Auto-expand first matching day when filter changes
  useEffect(() => {
    if (historyData.length > 0 && filterStatus !== "all") {
      // Helper function to check if intake matches filter
      const matchesFilter = (intake: any) => {
        if (filterStatus === "missed") {
          return intake.status === "skipped"
        }
        
        if (intake.status !== "taken" || !intake.scheduledTimestamp || !intake.takenAtTimestamp) {
          return false
        }
        
        const scheduled = new Date(intake.scheduledTimestamp)
        const taken = new Date(intake.takenAtTimestamp)
        const differenceMinutes = (taken.getTime() - scheduled.getTime()) / (1000 * 60)
        
        if (filterStatus === "ontime") {
          return differenceMinutes <= 30
        }
        
        if (filterStatus === "late") {
          return differenceMinutes > 30
        }
        
        return false
      }

      // Find first day with matching intakes
      const filteredData = historyData.filter(day => {
        const today = startOfDay(new Date())
        const dayDate = startOfDay(day.date)
        return dayDate <= today
      })

      for (const day of filteredData) {
        const hasMatchingIntake = day.intakes.some(matchesFilter)
        if (hasMatchingIntake) {
          const dayKey = day.date.toISOString()
          const newSet = new Set<string>()
          
          // Keep today if it exists
          const todayData = historyData.find(d => isToday(d.date))
          if (todayData) {
            newSet.add(todayData.date.toISOString())
          }
          
          // Add the first matching day
          newSet.add(dayKey)
          setExpandedDays(newSet)
          break
        }
      }
    }
  }, [filterStatus, historyData])

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set<string>()
      
      // Keep today always in the set if it exists
      const todayData = historyData.find(day => isToday(day.date))
      if (todayData) {
        newSet.add(todayData.date.toISOString())
      }
      
      // Toggle the clicked day (only one non-today day can be open)
      if (!prev.has(dateKey)) {
        newSet.add(dateKey)
      }
      
      return newSet
    })
  }

  return {
    expandedDays,
    todayRef,
    toggleDay
  }
}
