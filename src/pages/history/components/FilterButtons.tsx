import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { List, CheckCircle2, ClockAlert, XCircle } from "lucide-react"
import { FilterStatus } from "../types"

interface FilterButtonsProps {
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  counts: {
    all: number
    ontime: number
    late: number
    missed: number
  }
}

export const FilterButtons = ({ filterStatus, onFilterChange, counts }: FilterButtonsProps) => {
  return (
    <Card className="p-3">
      <div className="grid grid-cols-4 gap-2">
        <Button 
          variant={filterStatus === "all" ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange("all")}
          className="h-10 w-full relative"
        >
          <List className="h-5 w-5" />
          {counts.all > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground border-2 border-background">
              {counts.all}
            </span>
          )}
        </Button>
        <Button 
          variant={filterStatus === "ontime" ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange("ontime")}
          className={`h-10 w-full relative ${filterStatus === "ontime" ? "" : "border-success/50 text-success hover:bg-success/10"}`}
        >
          <CheckCircle2 className="h-5 w-5" />
          {counts.ontime > 0 && (
            <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full border-2 border-background ${filterStatus === "ontime" ? "bg-primary-foreground text-primary" : "bg-success text-white"}`}>
              {counts.ontime}
            </span>
          )}
        </Button>
        <Button 
          variant={filterStatus === "late" ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange("late")}
          className={`h-10 w-full relative ${filterStatus === "late" ? "" : "border-success/50 text-success hover:bg-success/10"}`}
        >
          <ClockAlert className="h-5 w-5" />
          {counts.late > 0 && (
            <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full border-2 border-background ${filterStatus === "late" ? "bg-primary-foreground text-primary" : "bg-success text-white"}`}>
              {counts.late}
            </span>
          )}
        </Button>
        <Button 
          variant={filterStatus === "missed" ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange("missed")}
          className={`h-10 w-full relative ${filterStatus === "missed" ? "" : "border-danger/50 text-danger hover:bg-danger/10"}`}
        >
          <XCircle className="h-5 w-5" />
          {counts.missed > 0 && (
            <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full border-2 border-background ${filterStatus === "missed" ? "bg-primary-foreground text-primary" : "bg-danger text-white"}`}>
              {counts.missed}
            </span>
          )}
        </Button>
      </div>
    </Card>
  )
}
