import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface StockCardData {
  medication: {
    name: string;
    pathology?: string;
    takesPerDay: number;
    unitsPerTake: number;
    minThreshold: number;
  };
  index: number;
}

interface StockHandlers {
  stock: number;
  onStockChange: (index: number, value: number) => void;
  onThresholdChange: (index: number, value: number) => void;
}

interface StockCardProps {
  data: StockCardData;
  handlers: StockHandlers;
}

export function StockCard({
  data,
  handlers,
}: StockCardProps) {
  const { medication, index } = data;
  const { stock, onStockChange, onThresholdChange } = handlers;
  const dailyConsumption = medication.takesPerDay * medication.unitsPerTake;
  const estimatedDays = stock ? Math.floor(stock / dailyConsumption) : 0;

  const handleStockFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      // Permettre le champ vide temporairement (affiche vide, stocke 0)
      onStockChange(index, 0);
    } else {
      onStockChange(index, parseInt(value) || 0);
    }
  };

  const handleStockBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Si le champ est vide au blur, forcer à 0
    if (e.target.value === "") {
      onStockChange(index, 0);
    }
  };

  const handleThresholdFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      onThresholdChange(index, 0);
    } else {
      onThresholdChange(index, parseInt(value) || 0);
    }
  };

  const handleThresholdBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      onThresholdChange(index, 0);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold">{medication.name}</h4>
          {medication.pathology && (
            <Badge variant="secondary" className="mt-1">
              {medication.pathology}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`stock-${index}`}>
            Stock initial *
            {(!stock || stock === 0) && (
              <span className="text-destructive ml-1">Obligatoire</span>
            )}
          </Label>
          <Input
            id={`stock-${index}`}
            type="number"
            min="0"
            value={stock === 0 ? "" : stock}
            onChange={handleStockChange}
            onFocus={handleStockFocus}
            onDoubleClick={(e) => e.currentTarget.select()}
            onBlur={handleStockBlur}
            className="bg-surface"
            placeholder="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`threshold-${index}`}>Seuil d'alerte</Label>
          <Input
            id={`threshold-${index}`}
            type="number"
            min="0"
            value={medication.minThreshold === 0 ? "" : medication.minThreshold}
            onChange={handleThresholdChange}
            onFocus={handleThresholdFocus}
            onDoubleClick={(e) => e.currentTarget.select()}
            onBlur={handleThresholdBlur}
            className="bg-surface"
            placeholder="0"
          />
        </div>
      </div>

      <div className="mt-3 p-3 bg-muted/50 rounded-md">
        <p className="text-sm">
          <span className="font-medium">Consommation estimée:</span>{" "}
          {dailyConsumption} unités/jour
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Durée estimée: {estimatedDays} jours
        </p>
      </div>
    </Card>
  );
}
