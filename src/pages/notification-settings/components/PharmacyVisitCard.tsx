import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Clock } from "lucide-react";

interface PharmacyVisitCardProps {
  enabled: boolean;
  reminderDays: number;
  pushEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onReminderDaysChange: (value: number) => void;
}

export function PharmacyVisitCard({
  enabled,
  reminderDays,
  pushEnabled,
  onToggle,
  onReminderDaysChange,
}: PharmacyVisitCardProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Pharmacie</h3>
          <p className="text-sm text-muted-foreground">
            Avant renouvellement
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
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="pharmacy-days" className="text-sm">
              Rappel
            </Label>
            <div className="flex items-center gap-2">
              <NumberInput
                id="pharmacy-days"
                min={0}
                max={7}
                value={reminderDays}
                onChange={onReminderDaysChange}
                className="w-16"
              />
              <span className="text-sm text-muted-foreground">jour(s)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Avant renouvellement
          </p>
        </div>
      )}
    </Card>
  );
}
