import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react';
import type { SyncSummary } from '../types';
import { COLOR_LEGEND } from '../utils/eventMapper';

interface SyncConfirmationProps {
  summary: SyncSummary | null;
  confirmed: boolean;
  onConfirmChange: (confirmed: boolean) => void;
}

export const SyncConfirmation = ({ summary, confirmed, onConfirmChange }: SyncConfirmationProps) => {
  if (!summary) return null;

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4" />
          Récapitulatif de la synchronisation
        </CardTitle>
        <CardDescription className="text-xs">
          Vérifiez les actions qui seront effectuées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Événements totaux</p>
            <p className="text-2xl font-bold">{summary.totalEvents}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Dont prises</p>
            <p className="text-2xl font-bold text-blue-500">{summary.intakesCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Dont rendez-vous</p>
            <p className="text-2xl font-bold text-purple-500">{summary.appointmentsCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Période</p>
            <div className="flex gap-1">
              {summary.historyDays > 0 && (
                <Badge variant="secondary">-{summary.historyDays}j</Badge>
              )}
              {summary.futureDays > 0 && (
                <Badge variant="default">+{summary.futureDays}j</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3 space-y-2">
          <p className="text-sm font-medium">Actions prévues :</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {summary.intakesCount > 0 && (
              <li className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-500" />
                {summary.intakesCount} prises de médicaments (style Rappel • 15 min)
              </li>
            )}
            {summary.appointmentsCount > 0 && (
              <li className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-purple-500" />
                {summary.appointmentsCount} rendez-vous (style Événement • 1h)
              </li>
            )}
            {summary.historyDays > 0 && (
              <li>• Conservation de l'historique sur {summary.historyDays} jours</li>
            )}
            {summary.futureDays > 0 && (
              <li>• Synchronisation des {summary.futureDays} prochains jours</li>
            )}
            <li className="text-xs pt-2 border-t mt-2">
              ℹ️ Les événements d'aujourd'hui ne sont PAS synchronisés
            </li>
          </ul>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-semibold">Légende des couleurs :</p>
          
          {/* Prises de médicaments */}
          {summary.intakesCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {COLOR_LEGEND.intakes.title}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_LEGEND.intakes.colors.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.emoji} {item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rendez-vous */}
          {summary.appointmentsCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {COLOR_LEGEND.appointments.title}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_LEGEND.appointments.colors.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.emoji} {item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
          <Checkbox
            id="confirm-sync"
            checked={confirmed}
            onCheckedChange={(checked) => onConfirmChange(checked === true)}
          />
          <Label htmlFor="confirm-sync" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Je confirme ces actions</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              En cochant cette case, vous autorisez la synchronisation avec votre calendrier natif.
            </p>
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};