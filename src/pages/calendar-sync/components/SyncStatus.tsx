import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SyncResult } from '../types';

interface SyncStatusProps {
  lastSyncDate: string | null;
  lastSyncResult: SyncResult | null;
  syncing: boolean;
  onSync: () => void;
  onClearAndResync?: () => void;
  canSync: boolean;
}

export const SyncStatus = ({
  lastSyncDate,
  lastSyncResult,
  syncing,
  onSync,
  onClearAndResync,
  canSync
}: SyncStatusProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          État de la synchronisation
        </CardTitle>
        <CardDescription className="text-xs">
          Synchronisez vos événements de santé avec votre calendrier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSyncDate && (
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Dernière synchronisation</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(lastSyncDate), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
        )}

        {lastSyncResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {lastSyncResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <p className="font-medium">
                {lastSyncResult.success ? 'Synchronisation réussie' : 'Synchronisation échouée'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted p-2">
                <p className="text-xs text-muted-foreground">Créés</p>
                <p className="text-lg font-bold">{lastSyncResult.eventsCreated}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-xs text-muted-foreground">Modifiés</p>
                <p className="text-lg font-bold">{lastSyncResult.eventsUpdated}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-xs text-muted-foreground">Supprimés</p>
                <p className="text-lg font-bold">{lastSyncResult.eventsDeleted}</p>
              </div>
            </div>

            {lastSyncResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Erreurs rencontrées:</p>
                  <ul className="list-disc list-inside text-sm">
                    {lastSyncResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Button
          onClick={onSync}
          disabled={!canSync || syncing}
          className="w-full"
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

        {onClearAndResync && (
          <Button
            onClick={onClearAndResync}
            disabled={!canSync || syncing}
            variant="destructive"
            className="w-full"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Réinitialiser et resynchroniser
              </>
            )}
          </Button>
        )}

        {!canSync && (
          <Alert>
            <AlertDescription className="text-sm">
              Veuillez sélectionner un calendrier et activer au moins un type d'événement
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};