import { Card } from "@/components/ui/card";

export function EmptyStocksList() {
  return (
    <Card className="p-8 text-center">
      <p className="text-muted-foreground">Aucun médicament à configurer</p>
      <p className="text-sm text-muted-foreground mt-2">
        Retournez à l'étape précédente pour ajouter des médicaments
      </p>
    </Card>
  );
}
