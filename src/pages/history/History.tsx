import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { startOfDay } from "date-fns"
import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useAdherenceStats } from "@/hooks/useAdherenceStats"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHistoryData } from "./hooks/useHistoryData"
import { useFilteredHistory } from "./hooks/useFilteredHistory"
import { useExpandedDays } from "./hooks/useExpandedDays"
import { FilterButtons } from "./components/FilterButtons"
import { DaySection } from "./components/DaySection"
import { StatsCards } from "./components/StatsCards"
import { EmptyState } from "./components/EmptyState"
import { FilterStatus, ActiveTab } from "./types"

export default function History() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<ActiveTab>((searchParams.get("tab") as ActiveTab) || "history")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  
  const { historyData, loading } = useHistoryData()
  const { stats, loading: statsLoading } = useAdherenceStats()
  
  // Filter data based on status
  const filteredData = useFilteredHistory(historyData, filterStatus)
  
  // Filter to show only today and past days
  const displayData = useMemo(() => {
    return filteredData.filter(day => {
      const today = startOfDay(new Date())
      const dayDate = startOfDay(day.date)
      return dayDate <= today
    })
  }, [filteredData])
  
  // Expanded days management
  const { expandedDays, todayRef, toggleDay } = useExpandedDays(historyData, filterStatus, activeTab)

  // Calculate filter counts from stats
  const filterCounts = useMemo(() => {
    if (!stats) return { all: 0, ontime: 0, late: 0, missed: 0, skipped: 0 }
    return {
      all: stats.takenOnTime + stats.lateIntakes + stats.skipped + stats.missed,
      ontime: stats.takenOnTime,
      late: stats.lateIntakes,
      missed: stats.missed,
      skipped: stats.skipped
    }
  }, [stats])

  // Calculate total completed and pending
  const { totalCompleted, totalPending } = useMemo(() => {
    const completed = historyData.reduce((sum, day) => 
      sum + day.intakes.filter(i => i.status !== 'pending').length, 0
    )
    const pending = historyData.reduce((sum, day) => 
      sum + day.intakes.filter(i => i.status === 'pending').length, 0
    )
    return { totalCompleted: completed, totalPending: pending }
  }, [historyData])

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab") as ActiveTab
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const handleFilterClick = (filter: FilterStatus) => {
    setFilterStatus(filter)
    setActiveTab("history")
    setSearchParams({ tab: "history" })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Historique"
          subtitle="Suivi des prises de médicaments"
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <FilterButtons
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              counts={filterCounts}
            />

            {displayData.length === 0 ? (
              <EmptyState />
            ) : (
              displayData.map((day, dayIdx) => {
                const dateKey = day.date.toISOString()
                const isExpanded = expandedDays.has(dateKey)
                
                return (
                  <DaySection
                    key={dayIdx}
                    day={day}
                    isExpanded={isExpanded}
                    onToggle={() => toggleDay(dateKey)}
                    ref={dayIdx === 0 ? todayRef : null}
                  />
                )
              })
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {!statsLoading && stats && (
              <StatsCards
                stats={stats}
                onFilterClick={handleFilterClick}
                totalCompleted={totalCompleted}
                totalPending={totalPending}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
