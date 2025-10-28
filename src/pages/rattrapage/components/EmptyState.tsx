import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function EmptyState() {
  const navigate = useNavigate();
  
  return (
    <Card className="p-12 text-center">
      <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
      <h3 className="font-semibold text-lg mb-2">Tout est à jour !</h3>
      <p className="text-muted-foreground mb-4">
        Aucune prise manquée détectée
      </p>
      <Button onClick={() => navigate("/")}>
        Retour à l'accueil
      </Button>
    </Card>
  );
}
