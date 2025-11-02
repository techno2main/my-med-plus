import { AppLayout } from "@/components/Layout/AppLayout";
import { useExportConfig } from "./hooks/useExportConfig";
import { useExportData } from "./hooks/useExportData";
import { ExportConfigSection } from "./components/ExportConfig";
import { PeriodSelector } from "./components/PeriodSelector";
import { ExportActions } from "./components/ExportActions";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function ProfileExport() {
  const { config, updateConfig, loading: configLoading } = useExportConfig();
  const { fetchExportData, loading: exportLoading } = useExportData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleExportPDF = async () => {
    try {
      const data = await fetchExportData(config);
      if (data) {
        // Lazy load du générateur PDF uniquement quand nécessaire
        const { generatePDF } = await import("./utils/pdfGenerator");
        await generatePDF(data);
        toast({
          title: "Export réussi",
          description: "Le PDF s'ouvre automatiquement",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
        duration: 3000,
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
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Télécharger les données</h1>
            <p className="text-muted-foreground">
              Choisir les éléments à exporter
            </p>
          </div>
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
