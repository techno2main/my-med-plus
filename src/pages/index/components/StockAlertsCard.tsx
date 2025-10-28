import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { StockAlert } from "../types"

interface StockAlertsCardProps {
  alerts: StockAlert[]
}

export const StockAlertsCard = ({ alerts }: StockAlertsCardProps) => {
  if (alerts.length === 0) return null

  return (
    <Card className="p-4 border-warning/20 bg-warning/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-sm">Alertes de stock</h3>
          {alerts.map((alert) => (
            <div key={alert.id} className="text-sm">
              <p className="font-medium">{alert.medication}</p>
              <p className="text-muted-foreground">
                {alert.remaining} comprimés restants • ~{alert.daysLeft} jours
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
