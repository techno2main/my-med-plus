import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ExportConfig } from "../types";
import { FileText, Activity, Pill, FileCheck, History, Package } from "lucide-react";

interface ExportConfigProps {
  config: ExportConfig;
  onConfigChange: (config: Partial<ExportConfig>) => void;
}

export function ExportConfigSection({ config, onConfigChange }: ExportConfigProps) {
  const options = [
    {
      key: 'includeProfile' as keyof ExportConfig,
      label: 'Profil patient',
      description: 'Informations personnelles',
      icon: FileText,
    },
    {
      key: 'includeAdherence' as keyof ExportConfig,
      label: 'Statistiques d\'observance',
      description: 'Taux d\'observance',
      icon: Activity,
    },
    {
      key: 'includeTreatments' as keyof ExportConfig,
      label: 'Traitements détaillés',
      description: 'Liste complète avec médicaments',
      icon: Pill,
    },
    {
      key: 'includePrescriptions' as keyof ExportConfig,
      label: 'Ordonnances',
      description: 'Historique des prescriptions',
      icon: FileCheck,
    },
    {
      key: 'includeIntakeHistory' as keyof ExportConfig,
      label: 'Historique des prises',
      description: 'Détail de toutes les prises',
      icon: History,
    },
    {
      key: 'includeStocks' as keyof ExportConfig,
      label: 'État des stocks',
      description: 'Stocks actuels de médicaments',
      icon: Package,
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Données à exporter</h3>
      <div className="space-y-4">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.key} className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Icon className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={option.key} className="text-base cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
              <Switch
                id={option.key}
                checked={config[option.key] as boolean}
                onCheckedChange={(checked) => 
                  onConfigChange({ [option.key]: checked })
                }
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
