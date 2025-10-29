import { useEffect } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { useCalendarSync } from './hooks/useCalendarSync';
import { PermissionBanner } from './components/PermissionBanner';
import { CalendarSelector } from './components/CalendarSelector';
import { SyncOptions } from './components/SyncOptions';
import { SyncStatus } from './components/SyncStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export const CalendarSync = () => {
  const {
    config,
    updateConfig,
    nativeCalendar,
    syncing,
    lastSyncResult,
    syncToNativeCalendar
  } = useCalendarSync();

  useEffect(() => {
    // Charger les calendriers disponibles au montage si permission accordée
    if (nativeCalendar.permission.granted) {
      nativeCalendar.loadCalendars();
    }
  }, [nativeCalendar.permission.granted]);

  const handleRequestPermission = async () => {
    const granted = await nativeCalendar.requestPermission();
    if (granted) {
      nativeCalendar.loadCalendars();
    }
  };

  const handleSelectCalendar = (calendarId: string) => {
    updateConfig({ selectedCalendarId: calendarId });
  };

  const canSync = 
    config.selectedCalendarId !== null &&
    (config.syncIntakes || config.syncDoctorVisits || config.syncPharmacyVisits || config.syncPrescriptionRenewals);

  if (!nativeCalendar.isSupported) {
    return (
      <AppLayout>
        <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
          <PageHeader 
            title="Synchronisation calendrier" 
            backTo="/admin"
          />
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              La synchronisation avec le calendrier natif n'est disponible que sur mobile
              (iOS et Android). Cette fonctionnalité nécessite l'application installée via Capacitor.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Synchronisation calendrier" 
          backTo="/admin"
        />
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Synchronisez automatiquement vos prises de médicaments, rendez-vous médicaux,
            visites en pharmacie et renouvellements d'ordonnances avec votre calendrier natif.
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Synchronisation depuis le 13 octobre 2025
            </span>
          </AlertDescription>
        </Alert>

        <PermissionBanner
          permission={nativeCalendar.permission}
          onRequestPermission={handleRequestPermission}
          loading={nativeCalendar.loading}
        />

        {nativeCalendar.permission.granted && (
          <>
            <CalendarSelector
              calendars={nativeCalendar.availableCalendars}
              selectedCalendarId={config.selectedCalendarId}
              onSelectCalendar={handleSelectCalendar}
              onRefresh={nativeCalendar.loadCalendars}
              loading={nativeCalendar.loading}
            />

            <SyncOptions
              config={config}
              onUpdateConfig={updateConfig}
            />

            <SyncStatus
              lastSyncDate={config.lastSyncDate}
              lastSyncResult={lastSyncResult}
              syncing={syncing}
              onSync={syncToNativeCalendar}
              canSync={canSync}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default CalendarSync;
