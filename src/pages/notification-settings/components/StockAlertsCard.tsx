import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";

interface StockAlertsCardProps {
  enabled: boolean;
  pushEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function StockAlertsCard({
  enabled,
  pushEnabled,
  onToggle,
}: StockAlertsCardProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Alertes de stock</h3>
          <p className="text-sm text-muted-foreground">
            Quand le stock est bas
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={!pushEnabled}
        />
      </div>

      {enabled && (
        <div className="pl-11">
          <p className="text-xs text-muted-foreground">
            Lorsque le seuil d'alerte est atteint
          </p>
        </div>
      )}
    </Card>
  );
}
