import { Card } from "@/components/ui/card";
import { Package, TrendingDown, Calendar } from "lucide-react";
import { StockStatusBadge } from "./StockStatusBadge";

interface StockDetailsCardProps {
  currentStock: number;
  minThreshold: number;
  status: "ok" | "low" | "critical";
  takesPerDay: number;
  unitsPerTake: number;
  estimatedDays: number;
  expiryDate?: string | null;
}

export function StockDetailsCard({
  currentStock,
  minThreshold,
  status,
  takesPerDay,
  unitsPerTake,
  estimatedDays,
  expiryDate,
}: StockDetailsCardProps) {
  const dailyConsumption = takesPerDay * unitsPerTake;

  return (
    <div className="space-y-6">
      {/* Statut actuel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">État du stock</h3>
          </div>
          <StockStatusBadge status={status} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Stock actuel</p>
            <p className="text-3xl font-bold text-primary">{currentStock}</p>
            <p className="text-sm text-muted-foreground">unités</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Seuil minimum</p>
            <p className="text-3xl font-bold">{minThreshold}</p>
            <p className="text-sm text-muted-foreground">unités</p>
          </div>
        </div>
      </Card>

      {/* Prévisions */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Prévisions</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-sm text-muted-foreground">Prises par jour</p>
            <p className="font-semibold">{takesPerDay} prise(s)/jour</p>
          </div>

          <div className="p-3 rounded-lg bg-surface">
            <p className="text-sm text-muted-foreground">Jours estimés</p>
            <p className="font-semibold">{estimatedDays} jours</p>
          </div>
        </div>

        {expiryDate && (
          <div className="mt-4 p-3 rounded-lg bg-surface">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date d'expiration</p>
                <p className="font-semibold">{new Date(expiryDate).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
