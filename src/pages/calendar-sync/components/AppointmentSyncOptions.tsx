import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Calendar } from 'lucide-react';
import { useState } from 'react';
import type { AppointmentSyncConfig } from '../types';

interface AppointmentSyncOptionsProps {
  config: AppointmentSyncConfig;
  onUpdate: (config: AppointmentSyncConfig) => void;
}

export const AppointmentSyncOptions = ({ config, onUpdate }: AppointmentSyncOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateHistoryPeriod = (value: number, type: 'days' | 'weeks' | 'months') => {
    onUpdate({
      ...config,
      history: {
        ...config.history,
        period: { value, type }
      }
    });
  };

  const updateFuturePeriod = (value: number, type: 'days' | 'weeks' | 'months') => {
    onUpdate({
      ...config,
      future: {
        ...config.future,
        period: { value, type }
      }
    });
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <CardTitle className="text-base">Gérer les rendez-vous</CardTitle>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CardDescription className="text-xs">
            Style Événement : Événements longs (1h) • Couleurs profondes • Alertes espacées (24h et 1h avant)
          </CardDescription>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Types de rendez-vous */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Types de rendez-vous</h4>
              
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-doctor" className="flex-1 text-sm">
                    Rendez-vous médecin
                  </Label>
                  <Switch
                    id="sync-doctor"
                    checked={config.syncDoctorVisits}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      syncDoctorVisits: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-lab" className="flex-1 text-sm">
                    Analyses laboratoire
                  </Label>
                  <Switch
                    id="sync-lab"
                    checked={config.syncLabVisits}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      syncLabVisits: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-pharmacy" className="flex-1 text-sm">
                    Visites pharmacie
                  </Label>
                  <Switch
                    id="sync-pharmacy"
                    checked={config.syncPharmacyVisits}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      syncPharmacyVisits: checked
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Section Historique */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Historique</h4>
              
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label htmlFor="appt-keep-history" className="flex-1">
                    <div>
                      <p className="font-medium">Conserver l'historique</p>
                      <p className="text-sm text-muted-foreground">
                        Les RDVs passés resteront synchronisés
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="appt-keep-history"
                    checked={config.history.keepHistory}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      history: { ...config.history, keepHistory: checked, deleteHistory: checked ? false : config.history.deleteHistory }
                    })}
                  />
                </div>

                {config.history.keepHistory && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="appt-history-value" className="text-xs">Période</Label>
                      <Input
                        id="appt-history-value"
                        type="number"
                        min="1"
                        value={config.history.period?.value || 30}
                        onChange={(e) => updateHistoryPeriod(
                          parseInt(e.target.value) || 30,
                          config.history.period?.type || 'days'
                        )}
                        className="mt-1"
                      />
                    </div>
                    <Select
                      value={config.history.period?.type || 'days'}
                      onValueChange={(value: any) => updateHistoryPeriod(
                        config.history.period?.value || 30,
                        value
                      )}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Jours</SelectItem>
                        <SelectItem value="weeks">Semaines</SelectItem>
                        <SelectItem value="months">Mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="appt-delete-history" className="flex-1">
                    <div>
                      <p className="font-medium">Supprimer l'historique</p>
                      <p className="text-sm text-muted-foreground">
                        Enlever les RDVs antérieurs du calendrier
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="appt-delete-history"
                    checked={config.history.deleteHistory}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      history: { ...config.history, deleteHistory: checked, keepHistory: checked ? false : config.history.keepHistory }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Section Futurs RDVs */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Rendez-vous futurs</h4>
              
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label htmlFor="appt-sync-future" className="flex-1">
                    <div>
                      <p className="font-medium">Synchroniser les prochains RDVs</p>
                      <p className="text-sm text-muted-foreground">
                        À partir de demain
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="appt-sync-future"
                    checked={config.future.syncFuture}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      future: { ...config.future, syncFuture: checked, doNotSync: checked ? false : config.future.doNotSync }
                    })}
                  />
                </div>

                {config.future.syncFuture && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="appt-future-value" className="text-xs">Période</Label>
                      <Input
                        id="appt-future-value"
                        type="number"
                        min="1"
                        value={config.future.period?.value || 90}
                        onChange={(e) => updateFuturePeriod(
                          parseInt(e.target.value) || 90,
                          config.future.period?.type || 'days'
                        )}
                        className="mt-1"
                      />
                    </div>
                    <Select
                      value={config.future.period?.type || 'days'}
                      onValueChange={(value: any) => updateFuturePeriod(
                        config.future.period?.value || 90,
                        value
                      )}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Jours</SelectItem>
                        <SelectItem value="weeks">Semaines</SelectItem>
                        <SelectItem value="months">Mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="appt-no-sync" className="flex-1">
                    <div>
                      <p className="font-medium">Ne pas synchroniser</p>
                      <p className="text-sm text-muted-foreground">
                        Les RDVs futurs seront purgés
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="appt-no-sync"
                    checked={config.future.doNotSync}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      future: { ...config.future, doNotSync: checked, syncFuture: checked ? false : config.future.syncFuture }
                    })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};