import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useExportConfig } from "@/pages/profile-export/hooks/useExportConfig";
import { useExportData } from "@/pages/profile-export/hooks/useExportData";
import { ExportConfigSection } from "@/pages/profile-export/components/ExportConfig";
import { PeriodSelector } from "@/pages/profile-export/components/PeriodSelector";
import { ExportActions } from "@/pages/profile-export/components/ExportActions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportComplete: () => void;
}

export function ExportDialog({ open, onOpenChange, onExportComplete }: ExportDialogProps) {
  const { config, updateConfig, loading: configLoading } = useExportConfig();
  const { fetchExportData, loading: exportLoading } = useExportData();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const data = await fetchExportData(config);
      if (data) {
        // Lazy load du générateur PDF uniquement quand nécessaire
        const { generatePDF } = await import("@/pages/profile-export/utils/pdfGenerator");
        await generatePDF(data);
        toast({
          title: "Export réussi",
          description: "Le PDF a été téléchargé avec succès",
          duration: 3000,
        });
        // Attendre un peu avant de fermer pour que l'utilisateur voie le toast
        setTimeout(() => {
          onExportComplete();
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
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
          description: "Le fichier JSON a été téléchargé",
          duration: 3000,
        });
        
        setTimeout(() => {
          onExportComplete();
        }, 1500);
      }
    } catch (error) {
      console.error('Erreur export JSON:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le JSON",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Télécharger les données</DialogTitle>
          <DialogDescription>
            Sélectionnez les données à inclure dans votre export et choisissez le format souhaité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <PeriodSelector
            config={config}
            onConfigChange={updateConfig}
          />

          <ExportConfigSection
            config={config}
            onConfigChange={updateConfig}
          />

          <ExportActions
            onExportPDF={handleExportPDF}
            onExportJSON={handleExportJSON}
            loading={configLoading || exportLoading || isExporting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
