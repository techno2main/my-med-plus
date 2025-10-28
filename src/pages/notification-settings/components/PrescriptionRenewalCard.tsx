import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface PrescriptionRenewalCardProps {
  enabled: boolean;
  renewalDays: number[];
  pushEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PrescriptionRenewalCard({
  enabled,
  renewalDays,
  pushEnabled,
  onToggle,
}: PrescriptionRenewalCardProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Ordonnances</h3>
          <p className="text-sm text-muted-foreground">
            Avant expiration
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={!pushEnabled}
        />
      </div>

      {enabled && (
        <div className="pl-11 space-y-3">
          <div className="flex flex-wrap gap-2">
            {renewalDays.map((days, index) => (
              <Badge key={index} variant="secondary">
                J-{days}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Rappels avant échéance
          </p>
        </div>
      )}
    </Card>
  );
}
