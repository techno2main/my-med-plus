import { AppLayout } from "@/components/Layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TreatmentWizard } from "@/components/TreatmentWizard/TreatmentWizard";

export default function TreatmentForm() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto px-3 md:px-4 py-6 space-y-6 pb-28">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/treatments")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouveau traitement</h1>
            <p className="text-sm text-muted-foreground">
              Créez votre traitement en 4 étapes
            </p>
          </div>
        </div>

        <TreatmentWizard />
      </div>
    </AppLayout>
  );
}
