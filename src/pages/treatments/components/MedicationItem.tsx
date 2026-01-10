import { Badge } from "@/components/ui/badge"
import { Clock, Pill, Pause } from "lucide-react"

interface MedicationItemProps {
  medication: {
    id: string
    name: string
    posology: string
    times: string[]
    pathology: string | null
    currentStock: number
    minThreshold: number
    isPaused: boolean
  }
  isArchived?: boolean
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

export const MedicationItem = ({ medication, isArchived = false }: MedicationItemProps) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      {medication.isPaused ? (
        <Pause className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
      ) : (
        <Pill className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm">
            {medication.name} <span className="text-muted-foreground">• {medication.posology}</span>
          </p>
          {isArchived ? (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
              Terminé
            </Badge>
          ) : (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(medication.currentStock, medication.minThreshold)}`}>
              <Pill className={`h-3 w-3 ${getStockColor(medication.currentStock, medication.minThreshold)}`} />
              <span className={`text-xs font-semibold ${getStockColor(medication.currentStock, medication.minThreshold)}`}>
                {medication.currentStock}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{medication.times.join(", ")}</span>
          </div>
          {medication.pathology && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {medication.pathology}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
