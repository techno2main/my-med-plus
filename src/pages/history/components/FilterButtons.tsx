import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { List, CheckCircle2, ClockAlert, XCircle, SkipForward } from "lucide-react"
import { FilterStatus } from "../types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FilterButtonsProps {
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  counts: {
    all: number
    ontime: number
    late: number
    missed: number
    skipped: number
  }
}

export const FilterButtons = ({ filterStatus, onFilterChange, counts }: FilterButtonsProps) => {
  return (
    <Card className="p-3">
      <TooltipProvider>
        <div className="grid grid-cols-5 gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={filterStatus === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => onFilterChange("all")}
                className="h-10 w-full relative px-1"
              >
                <List className="h-5 w-5" />
                {counts.all > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full bg-primary text-primary-foreground border-2 border-background">
                    {counts.all}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toutes les prises</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={filterStatus === "ontime" ? "default" : "outline"} 
                size="sm"
                onClick={() => onFilterChange("ontime")}
                className={`h-10 w-full relative px-1 ${filterStatus === "ontime" ? "" : "border-success/50 text-success hover:bg-success/10"}`}
              >
                <CheckCircle2 className="h-5 w-5" />
                {counts.ontime > 0 && (
                  <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full border-2 border-background ${filterStatus === "ontime" ? "bg-primary-foreground text-primary" : "bg-success text-white"}`}>
                    {counts.ontime}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>À l'heure</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={filterStatus === "late" ? "default" : "outline"} 
                size="sm"
                onClick={() => onFilterChange("late")}
                className={`h-10 w-full relative px-1 ${filterStatus === "late" ? "" : "border-success/50 text-success hover:bg-success/10"}`}
              >
                <ClockAlert className="h-5 w-5" />
                {counts.late > 0 && (
                  <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full border-2 border-background ${filterStatus === "late" ? "bg-primary-foreground text-primary" : "bg-success text-white"}`}>
                    {counts.late}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>En retard</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={filterStatus === "skipped" ? "default" : "outline"} 
                size="sm"
                onClick={() => onFilterChange("skipped")}
                className={`h-10 w-full relative px-1 ${filterStatus === "skipped" ? "" : "border-warning/50 text-warning hover:bg-warning/10"}`}
              >
                <SkipForward className="h-5 w-5" />
                {counts.skipped > 0 && (
                  <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full border-2 border-background ${filterStatus === "skipped" ? "bg-primary-foreground text-primary" : "bg-warning text-white"}`}>
                    {counts.skipped}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sautées</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={filterStatus === "missed" ? "default" : "outline"} 
                size="sm"
                onClick={() => onFilterChange("missed")}
                className={`h-10 w-full relative px-1 ${filterStatus === "missed" ? "" : "border-danger/50 text-danger hover:bg-danger/10"}`}
              >
                <XCircle className="h-5 w-5" />
                {counts.missed > 0 && (
                  <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full border-2 border-background ${filterStatus === "missed" ? "bg-primary-foreground text-primary" : "bg-danger text-white"}`}>
                    {counts.missed}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manquées</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </Card>
  )
}
