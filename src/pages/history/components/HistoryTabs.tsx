import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActiveTab } from "../types"

interface HistoryTabsProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
}

export const HistoryTabs = ({ activeTab, onTabChange }: HistoryTabsProps) => {
  return (
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="history" onClick={() => onTabChange("history")}>
        Historique
      </TabsTrigger>
      <TabsTrigger value="statistics" onClick={() => onTabChange("statistics")}>
        Statistiques
      </TabsTrigger>
    </TabsList>
  )
}
