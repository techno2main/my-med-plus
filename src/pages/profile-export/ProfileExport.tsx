import { AppLayout } from "@/components/Layout/AppLayout";
import { useExportConfig } from "./hooks/useExportConfig";
import { useExportData } from "./hooks/useExportData";
import { ExportConfigSection } from "./components/ExportConfig";
import { PeriodSelector } from "./components/PeriodSelector";
import { ExportActions } from "./components/ExportActions";
import { generatePDF } from "./utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ProfileExport() {
  const { config, updateConfig, loading: configLoading } = useExportConfig();
  const { fetchExportData, loading: exportLoading } = useExportData();
  const { toast } = useToast();

  const handleExportPDF = async () => {
    try {
      const data = await fetchExportData(config);
      if (data) {
        await generatePDF(data);
        toast({
          title: "Export réussi",
          description: "Votre fichier PDF a été sauvegardé dans Documents",
        });
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = async () => {
    const data = await fetchExportData(config);
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MyHealthPlus_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: "Votre fichier JSON a été téléchargé",
      });
    }
  };

  if (configLoading) {
    return (
      <AppLayout>
        <div className="container py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Exporter vos données médicales</h1>
          <p className="text-muted-foreground">
            Personnalisez et téléchargez un export complet de vos informations de santé
          </p>
        </div>

        <ExportConfigSection 
          config={config}
          onConfigChange={updateConfig}
        />

        <PeriodSelector 
          config={config}
          onConfigChange={updateConfig}
        />

        <ExportActions
          onExportPDF={handleExportPDF}
          onExportJSON={handleExportJSON}
          loading={exportLoading}
        />
      </div>
    </AppLayout>
  );
}
