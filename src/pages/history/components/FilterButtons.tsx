import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FilterStatus } from "../types"
import { StatusIcon, IntakeStatus } from "@/components/ui/status-icon"
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

const filterItems: { status: IntakeStatus; filterKey: FilterStatus; borderClass: string }[] = [
  { status: 'all', filterKey: 'all', borderClass: '' },
  { status: 'ontime', filterKey: 'ontime', borderClass: 'border-success/50 text-success hover:bg-success/10' },
  { status: 'late', filterKey: 'late', borderClass: 'border-success/50 text-success hover:bg-success/10' },
  { status: 'skipped', filterKey: 'skipped', borderClass: 'border-warning/50 text-warning hover:bg-warning/10' },
  { status: 'missed', filterKey: 'missed', borderClass: 'border-danger/50 text-danger hover:bg-danger/10' },
]

const statusLabels: Record<IntakeStatus, string> = {
  all: 'Toutes les prises',
  ontime: 'À l\'heure',
  late: 'En retard',
  skipped: 'Sautées',
  missed: 'Manquées',
  taken: 'Prise effectuée',
  pending: 'En attente',
}

const getBadgeClasses = (isActive: boolean, status: IntakeStatus) => {
  if (isActive) return "bg-primary-foreground text-primary"
  switch (status) {
    case 'ontime':
    case 'late':
      return "bg-success text-white"
    case 'skipped':
      return "bg-warning text-white"
    case 'missed':
      return "bg-danger text-white"
    default:
      return "bg-primary text-primary-foreground"
  }
}

export const FilterButtons = ({ filterStatus, onFilterChange, counts }: FilterButtonsProps) => {
  return (
    <Card className="p-3">
      <TooltipProvider>
        <div className="grid grid-cols-5 gap-1.5">
          {filterItems.map(({ status, filterKey, borderClass }) => {
            const isActive = filterStatus === filterKey
            const count = counts[filterKey]
            
            return (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isActive ? "default" : "outline"} 
                    size="sm"
                    onClick={() => onFilterChange(filterKey)}
                    className={`h-10 w-full relative px-1 ${isActive ? '' : borderClass}`}
                  >
                    <StatusIcon status={status} size="md" showTooltip={false} />
                    {count > 0 && (
                      <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full border-2 border-background ${getBadgeClasses(isActive, status)}`}>
                        {count}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusLabels[status]}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </Card>
  )
}
