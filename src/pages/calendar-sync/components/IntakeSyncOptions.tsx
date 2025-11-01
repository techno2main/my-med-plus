import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Pill } from 'lucide-react';
import { useState } from 'react';
import type { IntakeSyncConfig, SyncPeriod } from '../types';

interface IntakeSyncOptionsProps {
  config: IntakeSyncConfig;
  onUpdate: (config: IntakeSyncConfig) => void;
}

export const IntakeSyncOptions = ({ config, onUpdate }: IntakeSyncOptionsProps) => {
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
              <Pill className="h-4 w-4" />
              <CardTitle className="text-base">Gérer les prises de médicaments</CardTitle>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CardDescription className="text-xs">
            Style Rappel : Événements courts (15 min) • Couleurs vives • Alertes rapprochées (15 et 5 min avant)
          </CardDescription>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Section Historique */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Historique</h4>
              
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label htmlFor="keep-history" className="flex-1">
                    <div>
                      <p className="font-medium">Conserver l'historique</p>
                      <p className="text-sm text-muted-foreground">
                        Les prises passées resteront synchronisées
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="keep-history"
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
                      <Label htmlFor="history-value" className="text-xs">Période</Label>
                      <Input
                        id="history-value"
                        type="number"
                        min="1"
                        value={config.history.period?.value || 7}
                        onChange={(e) => updateHistoryPeriod(
                          parseInt(e.target.value) || 7,
                          config.history.period?.type || 'days'
                        )}
                        className="mt-1"
                      />
                    </div>
                    <Select
                      value={config.history.period?.type || 'days'}
                      onValueChange={(value: any) => updateHistoryPeriod(
                        config.history.period?.value || 7,
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
                  <Label htmlFor="delete-history" className="flex-1">
                    <div>
                      <p className="font-medium">Supprimer l'historique</p>
                      <p className="text-sm text-muted-foreground">
                        Enlever les prises antérieures du calendrier
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="delete-history"
                    checked={config.history.deleteHistory}
                    onCheckedChange={(checked) => onUpdate({
                      ...config,
                      history: { ...config.history, deleteHistory: checked, keepHistory: checked ? false : config.history.keepHistory }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Section Futures prises */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Prises futures</h4>
              
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-future" className="flex-1">
                    <div>
                      <p className="font-medium">Synchroniser les prochaines prises</p>
                      <p className="text-sm text-muted-foreground">
                        À partir de demain (aujourd'hui exclu)
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="sync-future"
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
                      <Label htmlFor="future-value" className="text-xs">Période</Label>
                      <Input
                        id="future-value"
                        type="number"
                        min="1"
                        value={config.future.period?.value || 7}
                        onChange={(e) => updateFuturePeriod(
                          parseInt(e.target.value) || 7,
                          config.future.period?.type || 'days'
                        )}
                        className="mt-1"
                      />
                    </div>
                    <Select
                      value={config.future.period?.type || 'days'}
                      onValueChange={(value: any) => updateFuturePeriod(
                        config.future.period?.value || 7,
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
                  <Label htmlFor="no-sync" className="flex-1">
                    <div>
                      <p className="font-medium">Ne pas synchroniser</p>
                      <p className="text-sm text-muted-foreground">
                        Les prises futures seront purgées
                      </p>
                    </div>
                  </Label>
                  <Switch
                    id="no-sync"
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