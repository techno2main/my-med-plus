import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Pill, CheckCircle2, ClockAlert, SkipForward, Pause, XCircle } from "lucide-react"
import { format } from "date-fns"
import { isIntakeValidationAllowed, getLocalDateString } from "@/lib/dateUtils"
import { UpcomingIntake } from "../types"
import { StatusIcon, calculateIntakeStatus } from "@/components/ui/status-icon"

interface IntakeCardProps {
  intake: UpcomingIntake
  isOverdue: boolean
  isTomorrowSection?: boolean
  onTake: (intake: UpcomingIntake) => void
}

const getStockColor = (stock: number, threshold: number) => {
  if (stock === 0) return "text-danger"
  if (stock <= threshold) return "text-warning"
  return "text-success"
}

const getStockBgColor = (stock: number, threshold: number) => {
  if (stock === 0) return "bg-danger/10"
  if (stock <= threshold) return "bg-warning/10"
  return "bg-success/10"
}

const getButtonClasses = (
  stock: number, 
  threshold: number, 
  isOverdue: boolean,
  isDisabledByTime: boolean,
  isTomorrowSection: boolean,
  isTaken: boolean,
  isPaused: boolean
) => {
  if (isTaken || isTomorrowSection || isDisabledByTime || isPaused) {
    return "bg-primary/60 text-white h-8 w-8 p-0 cursor-not-allowed"
  }
  
  if (isOverdue) {
    return "bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
  }
  
  if (stock === 0) {
    return "bg-red-500 hover:bg-red-600 text-white h-8 w-8 p-0"
  }
  if (stock <= threshold) {
    return "bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
  }
  
  return "gradient-primary h-8 w-8 p-0"
}

export const IntakeCard = ({ intake, isOverdue, isTomorrowSection = false, onTake }: IntakeCardProps) => {
  const isToday = getLocalDateString(intake.date) === getLocalDateString(new Date())
  const isValidationAllowed = isIntakeValidationAllowed()
  const isDisabledByTime = isToday && !isValidationAllowed && !isTomorrowSection
  const isTaken = intake.status === 'taken'
  const isMissed = intake.status === 'missed' || intake.status === 'skipped'
  const isPaused = intake.medicationIsPaused || false
  const isDisabled = intake.currentStock === 0 || isOverdue || isTomorrowSection || isDisabledByTime || isTaken || isMissed || isPaused
  
  const shouldShowOrangeBadge = isOverdue && !isTaken && !isMissed
  const isTakenLate = isTaken && intake.takenAt && 
    ((intake.takenAt.getTime() - intake.date.getTime()) / (1000 * 60) > 30)

  const calculatedStatus = calculateIntakeStatus(
    intake.status,
    intake.date,
    intake.takenAt || undefined
  )

  const getLeftIcon = () => {
    if (isPaused) {
      return <Pause className="h-3.5 w-3.5 mb-0.5 text-orange-600" />
    }
    if (isTaken) {
      if (isTakenLate) {
        return <ClockAlert className="h-3.5 w-3.5 mb-0.5 text-success" />
      }
      return <CheckCircle2 className="h-3.5 w-3.5 mb-0.5 text-success" />
    }
    if (intake.status === 'missed') {
      return <XCircle className="h-3.5 w-3.5 mb-0.5 text-danger" />
    }
    if (intake.status === 'skipped') {
      return <SkipForward className="h-3.5 w-3.5 mb-0.5 text-warning" />
    }
    return <Clock className={`h-3.5 w-3.5 mb-0.5 ${shouldShowOrangeBadge ? 'text-orange-600' : 'text-primary'}`} />
  }

  const getTimeBadgeBgColor = () => {
    if (isPaused) return 'bg-orange-100 dark:bg-orange-950/30'
    if (isTaken) return 'bg-success/10'
    if (intake.status === 'missed') return 'bg-danger/10'
    if (intake.status === 'skipped') return 'bg-warning/10'
    if (shouldShowOrangeBadge) return 'bg-orange-100 dark:bg-orange-950/30'
    return 'bg-primary/10'
  }

  const getTimeTextColor = () => {
    if (isPaused) return 'text-orange-700 dark:text-orange-400'
    if (isTaken) return 'text-success'
    if (intake.status === 'missed') return 'text-danger'
    if (intake.status === 'skipped') return 'text-warning'
    if (shouldShowOrangeBadge) return 'text-orange-700 dark:text-orange-400'
    return 'text-primary'
  }
  
  return (
    <Card className="p-3 surface-elevated hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg ${getTimeBadgeBgColor()}`}>
          {getLeftIcon()}
          <span className={`text-xs font-semibold ${getTimeTextColor()}`}>
            {isPaused ? "Pause" : intake.time}
          </span>
          <span className="text-[10px] text-muted-foreground">{format(intake.date, "dd/MM")}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{intake.medication}</p>
            <span className="text-xs text-muted-foreground flex-shrink-0">{intake.dosage}</span>
          </div>
          {intake.pathology && (
            <p className="text-xs text-muted-foreground truncate">{intake.pathology}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(intake.currentStock, intake.minThreshold)}`}>
            <Pill className={`h-3 w-3 ${getStockColor(intake.currentStock, intake.minThreshold)}`} />
            <span className={`text-xs font-semibold ${getStockColor(intake.currentStock, intake.minThreshold)}`}>
              {intake.currentStock}
            </span>
          </div>
          
          {isTaken ? (
            <div className="flex flex-col items-center">
              <StatusIcon status={calculatedStatus} size="lg" />
              {intake.takenAt && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {format(intake.takenAt, "HH:mm")}
                </span>
              )}
            </div>
          ) : isMissed ? (
            <StatusIcon status={calculatedStatus} size="lg" />
          ) : (
            <Button 
              size="sm" 
              className={getButtonClasses(
                intake.currentStock,
                intake.minThreshold,
                isOverdue,
                isDisabledByTime,
                isTomorrowSection,
                isTaken,
                isPaused
              )}
              onClick={() => onTake(intake)}
              disabled={isDisabled}
            >
              {isPaused ? (
                <Pause className="h-4 w-4" />
              ) : isOverdue ? (
                <ClockAlert className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
