import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

interface GlobalToggleCardProps {
  pushEnabled: boolean;
  isSupported: boolean;
  permission: string;
  onToggle: (enabled: boolean) => void;
}

export function GlobalToggleCard({
  pushEnabled,
  isSupported,
  permission,
  onToggle,
}: GlobalToggleCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Notifications push</p>
            <p className="text-sm text-muted-foreground">
              Activer tous les rappels
            </p>
          </div>
        </div>
        <Switch
          checked={pushEnabled}
          onCheckedChange={onToggle}
          disabled={!isSupported || permission === "denied"}
        />
      </div>
    </Card>
  );
}
