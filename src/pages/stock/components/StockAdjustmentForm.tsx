import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface StockAdjustmentFormProps {
  currentStock: number;
  adjustmentStr: string;
  setAdjustmentStr: (value: string) => void;
  adjustment: number;
  newStock: number;
  minThreshold: number;
  setMinThreshold: (value: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StockAdjustmentForm({
  currentStock,
  adjustmentStr,
  setAdjustmentStr,
  adjustment,
  newStock,
  minThreshold,
  setMinThreshold,
  onSubmit,
  onCancel,
  isLoading,
}: StockAdjustmentFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Stock actuel</Label>
          <div className="text-2xl font-bold">{currentStock} unités</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adjustment">Ajustement (+10 ou -5)</Label>
          <Input
            id="adjustment"
            value={adjustmentStr}
            onChange={(e) => setAdjustmentStr(e.target.value)}
            placeholder="+10 ou -5"
          />
          {adjustment !== 0 && (
            <p className="text-sm text-muted-foreground">
              Ajustement: {adjustment > 0 ? "+" : ""}
              {adjustment} unités
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Nouveau stock</Label>
          <div className="text-2xl font-bold text-primary">{newStock} unités</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minThreshold">Seuil minimum d'alerte</Label>
          <Input
            id="minThreshold"
            type="number"
            value={minThreshold}
            onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
          />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={adjustment === 0 || isLoading} className="flex-1">
          {isLoading ? "Enregistrement..." : "Valider"}
        </Button>
      </div>
    </form>
  );
}
