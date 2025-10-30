import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar, AlertTriangle } from 'lucide-react';
import type { CalendarPermissionStatus } from '../types';

interface PermissionBannerProps {
  permission: CalendarPermissionStatus;
  onRequestPermission: () => void;
  loading: boolean;
}

export const PermissionBanner = ({
  permission,
  onRequestPermission,
  loading
}: PermissionBannerProps) => {
  if (permission.granted) {
    return null;
  }

  return (
    <Alert variant={permission.canRequest ? 'default' : 'destructive'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Permission calendrier requise</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Pour synchroniser vos événements de santé avec votre calendrier natif,
          l'application a besoin d'accéder à votre calendrier.
        </p>
        {permission.canRequest ? (
          <Button
            onClick={onRequestPermission}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Autoriser l'accès au calendrier
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Veuillez autoriser l'accès au calendrier dans les paramètres de votre appareil.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};
