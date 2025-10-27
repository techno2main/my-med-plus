import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Pill, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { UpcomingIntake } from "../types"

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

export const IntakeCard = ({ intake, isOverdue, isTomorrowSection = false, onTake }: IntakeCardProps) => {
  return (
    <Card className="p-3 surface-elevated hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg ${isOverdue ? 'bg-orange-100' : 'bg-primary/10'}`}>
          <Clock className={`h-3.5 w-3.5 mb-0.5 ${isOverdue ? 'text-orange-600' : 'text-primary'}`} />
          <span className={`text-xs font-semibold ${isOverdue ? 'text-orange-700' : 'text-primary'}`}>{intake.time}</span>
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
          
          <Button 
            size="sm" 
            className={
              isTomorrowSection
                ? "gradient-primary h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                : intake.currentStock === 0 
                  ? "gradient-primary h-8 w-8 p-0" 
                  : isOverdue
                    ? "bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
                    : "gradient-primary h-8 w-8 p-0"
            }
            onClick={() => onTake(intake)}
            disabled={intake.currentStock === 0 || isOverdue || isTomorrowSection}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
