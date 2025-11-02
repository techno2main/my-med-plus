import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ExportDataCard() {
  const navigate = useNavigate();

  return (
    <Card 
      className="p-4 cursor-pointer hover:bg-accent transition-colors"
      onClick={() => navigate("/profile-export")}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Télécharger les données</h3>
          <p className="text-sm text-muted-foreground">
            Exporter vos données de santé
          </p>
        </div>
      </div>
    </Card>
  );
}
