import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle } from "lucide-react";

interface PermissionBannersProps {
  isSupported: boolean;
  hasPermission: boolean;
  permission: string;
  mode: string;
  onRequestPermission: () => void;
}

export function PermissionBanners({
  isSupported,
  hasPermission,
  permission,
  mode,
  onRequestPermission,
}: PermissionBannersProps) {
  if (!isSupported) {
    return (
      <Card className="p-4 border-warning bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <p className="font-medium">Notifications non supportées</p>
            <p className="text-sm text-muted-foreground">
              Votre navigateur ne supporte pas les notifications push
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const permissionGranted = mode === 'native' ? hasPermission : permission === "granted";

  if (!permissionGranted && permission !== "denied") {
    return (
      <Card className="p-4 border-primary bg-primary/5">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Activer les notifications</p>
            <p className="text-sm text-muted-foreground mb-3">
              Cliquez pour autoriser les notifications et recevoir vos rappels ({mode === 'native' ? 'Mode Natif' : 'Mode Web'})
            </p>
            <Button onClick={onRequestPermission} className="gradient-primary">
              Activer les notifications
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (permissionGranted) {
    return (
      <Card className="p-4 border-success bg-success/5">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-success mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">✓ Notifications activées</p>
            <p className="text-sm text-muted-foreground">
              Vous recevrez vos rappels selon vos préférences ({mode === 'native' ? 'Mode Natif' : 'Mode Web'})
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (mode === 'pwa' && permission === "denied") {
    return (
      <Card className="p-4 border-warning bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Notifications bloquées</p>
            <p className="text-sm text-muted-foreground mb-3">
              Allez dans les paramètres de votre navigateur pour autoriser les notifications pour ce site.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
