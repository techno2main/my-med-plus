import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface StockCardProps {
  medication: {
    name: string;
    pathology?: string;
    takesPerDay: number;
    unitsPerTake: number;
    minThreshold: number;
  };
  index: number;
  stock: number;
  onStockChange: (index: number, value: number) => void;
  onThresholdChange: (index: number, value: number) => void;
}

export function StockCard({
  medication,
  index,
  stock,
  onStockChange,
  onThresholdChange,
}: StockCardProps) {
  const dailyConsumption = medication.takesPerDay * medication.unitsPerTake;
  const estimatedDays = stock ? Math.floor(stock / dailyConsumption) : 0;

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
            value={stock || 0}
            onChange={(e) => onStockChange(index, parseInt(e.target.value) || 0)}
            className="bg-surface"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`threshold-${index}`}>Seuil d'alerte</Label>
          <Input
            id={`threshold-${index}`}
            type="number"
            min="0"
            value={medication.minThreshold}
            onChange={(e) => onThresholdChange(index, parseInt(e.target.value) || 0)}
            className="bg-surface"
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
