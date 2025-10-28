import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface StockAlertsProps {
  lowStockCount: number;
}

export function StockAlerts({ lowStockCount }: StockAlertsProps) {
  if (lowStockCount === 0) return null;

  return (
    <Card className="p-4 border-warning bg-warning/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-warning">
            {lowStockCount} médicament{lowStockCount > 1 ? "s" : ""} nécessite
            {lowStockCount > 1 ? "nt" : ""} un réapprovisionnement
          </p>
          <p className="text-sm text-muted-foreground mt-1">Stock bas ou critique détecté</p>
        </div>
      </div>
    </Card>
  );
}
