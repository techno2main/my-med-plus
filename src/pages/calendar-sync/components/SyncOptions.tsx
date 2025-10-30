import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import type { SyncConfig } from '../types';

interface SyncOptionsProps {
  config: SyncConfig;
  onUpdateConfig: (updates: Partial<SyncConfig>) => void;
}

export const SyncOptions = ({ config, onUpdateConfig }: SyncOptionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Options de synchronisation
        </CardTitle>
        <CardDescription>
          Choisissez les types d'événements à synchroniser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="sync-intakes" className="flex-1">
            <div>
              <p className="font-medium">Prises de médicaments</p>
              <p className="text-sm text-muted-foreground">
                Synchroniser toutes les prises avec leur statut
              </p>
            </div>
          </Label>
          <Switch
            id="sync-intakes"
            checked={config.syncIntakes}
            onCheckedChange={(checked) => onUpdateConfig({ syncIntakes: checked })}
          />
        </div>

        <div className="flex items-center justify-between opacity-50">
          <Label htmlFor="sync-doctor" className="flex-1 cursor-not-allowed">
            <div>
              <p className="font-medium">Rendez-vous médecin</p>
              <p className="text-sm text-muted-foreground">
                Fin de traitement et consultations (non disponible)
              </p>
            </div>
          </Label>
          <Switch
            id="sync-doctor"
            checked={config.syncDoctorVisits}
            onCheckedChange={(checked) => onUpdateConfig({ syncDoctorVisits: checked })}
            disabled={true}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sync-pharmacy" className="flex-1">
            <div>
              <p className="font-medium">Visites pharmacie</p>
              <p className="text-sm text-muted-foreground">
                Retraits de médicaments prévus
              </p>
            </div>
          </Label>
          <Switch
            id="sync-pharmacy"
            checked={config.syncPharmacyVisits}
            onCheckedChange={(checked) => onUpdateConfig({ syncPharmacyVisits: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sync-renewals" className="flex-1">
            <div>
              <p className="font-medium">Renouvellements ordonnance</p>
              <p className="text-sm text-muted-foreground">
                Rappels 7 jours avant expiration
              </p>
            </div>
          </Label>
          <Switch
            id="sync-renewals"
            checked={config.syncPrescriptionRenewals}
            onCheckedChange={(checked) => onUpdateConfig({ syncPrescriptionRenewals: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
};
