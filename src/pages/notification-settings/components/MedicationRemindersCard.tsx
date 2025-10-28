import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Pill } from "lucide-react";

interface MedicationRemindersCardProps {
  enabled: boolean;
  reminderBefore: number;
  reminderDelay: number;
  pushEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onReminderBeforeChange: (value: number) => void;
  onReminderDelayChange: (value: number) => void;
}

export function MedicationRemindersCard({
  enabled,
  reminderBefore,
  reminderDelay,
  pushEnabled,
  onToggle,
  onReminderBeforeChange,
  onReminderDelayChange,
}: MedicationRemindersCardProps) {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Pill className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Rappels de prise</h3>
          <p className="text-sm text-muted-foreground">
            Pour vos médicaments
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={!pushEnabled}
        />
      </div>

      {enabled && (
        <div className="pl-11 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="reminder-before" className="text-sm">
                Avant la prise
              </Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  id="reminder-before"
                  min={1}
                  max={60}
                  value={reminderBefore}
                  onChange={onReminderBeforeChange}
                  className="w-16"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Minutes avant la prise
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="reminder-delay" className="text-sm">
                Après la prise
              </Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  id="reminder-delay"
                  min={1}
                  max={60}
                  value={reminderDelay}
                  onChange={onReminderDelayChange}
                  className="w-16"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Minutes après la prise
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
