import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SyncResult } from '../types';

interface SyncReportProps {
  result: SyncResult;
  onClose: () => void;
}

export const SyncReport = ({ result, onClose }: SyncReportProps) => {
  const totalOperations = result.eventsCreated + result.eventsUpdated + result.eventsDeleted;

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <CardTitle className="text-base">
              {result.success ? 'Synchronisation terminée' : 'Synchronisation échouée'}
            </CardTitle>
          </div>
          <Badge variant={result.success ? 'default' : 'destructive'}>
            {format(new Date(), 'HH:mm', { locale: fr })}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Compte-rendu détaillé des opérations effectuées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques globales */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Créés</p>
            </div>
            <p className="text-2xl font-bold text-green-500">{result.eventsCreated}</p>
          </div>
          
          <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Modifiés</p>
            </div>
            <p className="text-2xl font-bold text-blue-500">{result.eventsUpdated}</p>
          </div>
          
          <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Supprimés</p>
            </div>
            <p className="text-2xl font-bold text-red-500">{result.eventsDeleted}</p>
          </div>
        </div>

        {/* Détails par type */}
        {result.details && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Détails par type</h4>
            
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Prises de médicaments</span>
                <Badge variant="outline">
                  {result.details.intakesCreated + result.details.intakesUpdated + result.details.intakesDeleted}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-muted-foreground">Créées</p>
                  <p className="font-bold text-green-500">{result.details.intakesCreated}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Modifiées</p>
                  <p className="font-bold text-blue-500">{result.details.intakesUpdated}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Supprimées</p>
                  <p className="font-bold text-red-500">{result.details.intakesDeleted}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rendez-vous</span>
                <Badge variant="outline">
                  {result.details.appointmentsCreated + result.details.appointmentsUpdated + result.details.appointmentsDeleted}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-muted-foreground">Créés</p>
                  <p className="font-bold text-green-500">{result.details.appointmentsCreated}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Modifiés</p>
                  <p className="font-bold text-blue-500">{result.details.appointmentsUpdated}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Supprimés</p>
                  <p className="font-bold text-red-500">{result.details.appointmentsDeleted}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résumé */}
        <Alert variant={result.success ? 'default' : 'destructive'}>
          <AlertDescription>
            {result.success ? (
              <p className="font-medium">
                ✓ {totalOperations} opération(s) effectuée(s) avec succès
              </p>
            ) : (
              <p className="font-medium">
                ✗ La synchronisation a rencontré des problèmes
              </p>
            )}
          </AlertDescription>
        </Alert>

        {/* Erreurs */}
        {result.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Erreurs rencontrées :</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {result.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};