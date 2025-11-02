import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { useCalendarSync } from './hooks/useCalendarSync';
import { PermissionBanner } from './components/PermissionBanner';
import { CalendarSelector } from './components/CalendarSelector';
import { IntakeSyncOptions } from './components/IntakeSyncOptions';
import { AppointmentSyncOptions } from './components/AppointmentSyncOptions';
import { SyncConfirmation } from './components/SyncConfirmation';
import { SyncReport } from './components/SyncReport';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon, RefreshCw, ArrowLeft } from 'lucide-react';

export const CalendarSync = () => {
  const navigate = useNavigate();
  const {
    config,
    updateConfig,
    nativeCalendar,
    syncing,
    lastSyncResult,
    syncSummary,
    syncToNativeCalendar,
    generateSyncSummary
  } = useCalendarSync();

  const [confirmed, setConfirmed] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await nativeCalendar.requestPermission();
    if (granted) {
      nativeCalendar.loadCalendars();
    }
  };

  const handleSync = async () => {
    if (!confirmed) return;
    
    setShowReport(false);
    await syncToNativeCalendar();
    setShowReport(true);
    setConfirmed(false); // Reset confirmation après synchro
  };

  const handleGenerateSummary = () => {
    generateSyncSummary();
  };

  const canGenerateSummary = 
    config.selectedCalendarId !== null &&
    (config.intakes.enabled || config.appointments.enabled);

  const canSync = canGenerateSummary && confirmed && syncSummary !== null;

  const isWebPreview = !nativeCalendar.isSupported;

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Synchronisation calendrier" 
          backTo="/settings"
        />
        
        {isWebPreview && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              La synchronisation avec le calendrier natif n'est disponible que sur mobile (iOS et Android).
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                ℹ️ Interface affichée en mode visualisation uniquement
              </span>
            </AlertDescription>
          </Alert>
        )}

        {!isWebPreview && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Synchronisez automatiquement vos prises et rendez-vous avec votre calendrier natif.
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                ⚠️ Les événements d'aujourd'hui ne sont jamais synchronisés
              </span>
            </AlertDescription>
          </Alert>
        )}

        {!isWebPreview && (
          <PermissionBanner
            permission={nativeCalendar.permission}
            onRequestPermission={handleRequestPermission}
            loading={nativeCalendar.loading}
          />
        )}

        {/* Lien retour vers Calendrier */}
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/calendar")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Retour vers Calendrier</span>
          </Button>
        </div>

        {/* Toujours afficher la sélection du calendrier pour visualisation */}
        {(isWebPreview || nativeCalendar.permission.granted) && (
          <>
            <CalendarSelector
              calendars={isWebPreview ? [] : nativeCalendar.availableCalendars}
              selectedCalendarId={config.selectedCalendarId}
              onSelectCalendar={(id) => updateConfig({ selectedCalendarId: id })}
              onRefresh={nativeCalendar.loadCalendars}
              loading={isWebPreview ? false : nativeCalendar.loading}
            />

            <IntakeSyncOptions
              config={config.intakes}
              onUpdate={(intakes) => updateConfig({ intakes })}
            />

            <AppointmentSyncOptions
              config={config.appointments}
              onUpdate={(appointments) => updateConfig({ appointments })}
            />

            {!syncSummary && (
              <Button
                onClick={handleGenerateSummary}
                disabled={isWebPreview || !canGenerateSummary || syncing}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isWebPreview ? 'Mode visualisation uniquement' : 'Générer le récapitulatif'}
              </Button>
            )}

            {syncSummary && !showReport && (
              <SyncConfirmation
                summary={syncSummary}
                confirmed={confirmed}
                onConfirmChange={setConfirmed}
              />
            )}

            {syncSummary && !showReport && !isWebPreview && (
              <Button
                onClick={handleSync}
                disabled={!canSync || syncing}
                className="w-full"
                size="lg"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Synchronisation en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synchroniser maintenant
                  </>
                )}
              </Button>
            )}

            {showReport && lastSyncResult && (
              <SyncReport
                result={lastSyncResult}
                onClose={() => setShowReport(false)}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default CalendarSync;