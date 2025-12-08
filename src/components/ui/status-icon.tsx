import { CheckCircle2, ClockAlert, XCircle, SkipForward, Clock, List } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type IntakeStatus = 'ontime' | 'late' | 'taken' | 'skipped' | 'missed' | 'pending' | 'all'

interface StatusIconProps {
  status: IntakeStatus
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const statusConfig: Record<IntakeStatus, { icon: typeof CheckCircle2; colorClass: string; label: string }> = {
  ontime: { icon: CheckCircle2, colorClass: 'text-success', label: 'À l\'heure' },
  late: { icon: ClockAlert, colorClass: 'text-success', label: 'En retard' },
  taken: { icon: CheckCircle2, colorClass: 'text-success', label: 'Prise effectuée' },
  skipped: { icon: SkipForward, colorClass: 'text-warning', label: 'Sautée' },
  missed: { icon: XCircle, colorClass: 'text-danger', label: 'Manquée' },
  pending: { icon: Clock, colorClass: 'text-muted-foreground', label: 'En attente' },
  all: { icon: List, colorClass: 'text-foreground', label: 'Toutes les prises' },
}

export const StatusIcon = ({ status, size = 'md', showTooltip = true, className }: StatusIconProps) => {
  const config = statusConfig[status]
  if (!config) return null

  const Icon = config.icon
  const iconElement = <Icon className={cn(sizeClasses[size], config.colorClass, className)} />

  if (!showTooltip) {
    return iconElement
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">{iconElement}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Helper pour calculer le statut d'une prise basé sur les timestamps
export const calculateIntakeStatus = (
  status: string,
  scheduledTimestamp?: string | Date,
  takenAtTimestamp?: string | Date
): IntakeStatus => {
  if (status === 'taken' && scheduledTimestamp && takenAtTimestamp) {
    const scheduled = scheduledTimestamp instanceof Date ? scheduledTimestamp : new Date(scheduledTimestamp)
    const taken = takenAtTimestamp instanceof Date ? takenAtTimestamp : new Date(takenAtTimestamp)
    const differenceMinutes = (taken.getTime() - scheduled.getTime()) / (1000 * 60)
    
    return differenceMinutes > 30 ? 'late' : 'ontime'
  }
  
  switch (status) {
    case 'taken':
      return 'ontime'
    case 'skipped':
      return 'skipped'
    case 'missed':
      return 'missed'
    case 'pending':
    default:
      return 'pending'
  }
}

// Variantes de couleur de fond pour les stats
export const statusBgClasses: Record<IntakeStatus, string> = {
  ontime: 'bg-success/10',
  late: 'bg-success/10',
  taken: 'bg-success/10',
  skipped: 'bg-warning/10',
  missed: 'bg-danger/10',
  pending: 'bg-muted/10',
  all: 'bg-primary/10',
}

export const statusHoverBgClasses: Record<IntakeStatus, string> = {
  ontime: 'hover:bg-success/20',
  late: 'hover:bg-success/20',
  taken: 'hover:bg-success/20',
  skipped: 'hover:bg-warning/20',
  missed: 'hover:bg-danger/20',
  pending: 'hover:bg-muted/20',
  all: 'hover:bg-primary/20',
}
