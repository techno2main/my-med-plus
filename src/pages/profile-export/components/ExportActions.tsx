import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileJson, Loader2 } from "lucide-react";

interface ExportActionsProps {
  onExportPDF: () => void;
  onExportJSON: () => void;
  loading: boolean;
}

export function ExportActions({ onExportPDF, onExportJSON, loading }: ExportActionsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Générer l'export</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onExportPDF}
          disabled={loading}
          className="flex-1"
          size="lg"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-5 w-5" />
          )}
          Exporter en PDF
        </Button>
        <Button
          onClick={onExportJSON}
          disabled={loading}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <FileJson className="mr-2 h-5 w-5" />
          )}
          Exporter en JSON
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-3">
        Le fichier sera téléchargé sur votre appareil
      </p>
    </Card>
  );
}
