import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { StockStatusBadge } from "./StockStatusBadge";
import { formatUnits } from "../utils/stockUtils";

interface StockCardProps {
  item: {
    id: string;
    medication: string;
    dosage: string;
    current_stock: number;
    min_threshold: number;
    unit: string;
    status: "ok" | "low" | "critical";
    expiry_date?: string | null;
  };
  onAdjust: () => void;
  onViewDetails: () => void;
}

export function StockCard({ item, onAdjust, onViewDetails }: StockCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{item.medication}</h3>
            {item.dosage && <span className="text-xs text-muted-foreground">{item.dosage}</span>}
          </div>
        </div>
        <StockStatusBadge status={item.status} />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm ml-6">
          <div>
            <p className="text-muted-foreground">Stock actuel</p>
            <p className="font-medium text-base">{formatUnits(item.current_stock || 0, item.unit)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Seuil minimum</p>
            <p className="font-medium text-base">{formatUnits(item.min_threshold || 10, item.unit)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 ml-6">
          <Button variant="outline" size="sm" className="text-xs justify-start pl-4" onClick={onAdjust}>
            Ajuster stock
          </Button>
          <Button variant="outline" size="sm" className="text-xs justify-start pl-4" onClick={onViewDetails}>
            Détails
          </Button>
        </div>

        {item.expiry_date && (
          <div className="ml-6">
            <p className="text-muted-foreground text-sm">Date d'expiration</p>
            <p className="font-medium">{new Date(item.expiry_date).toLocaleDateString("fr-FR")}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
