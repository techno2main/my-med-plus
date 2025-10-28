import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Pill } from "lucide-react";
import { getStockColor, getStockBgColor } from "../utils/medicationUtils";

interface MedicationCardProps {
  medication: {
    id: string;
    name: string;
    strength?: string | null;
    pathology?: string | null;
    default_posology?: string | null;
    description?: string | null;
    total_stock?: number;
    effective_threshold?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onStockClick: () => void;
}

export function MedicationCard({ medication, onEdit, onDelete, onStockClick }: MedicationCardProps) {
  return (
    <Card className="p-4 surface-elevated hover:shadow-md transition-shadow">
      <div className="space-y-2">
        {/* Ligne 1: Nom + Dosage */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{medication.name}</h3>
            {medication.strength && (
              <span className="text-sm text-muted-foreground">
                {medication.strength}
              </span>
            )}
          </div>
          <div className="flex items-center shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Ligne 2: Pathologie + Stock */}
        {(medication.pathology || medication.total_stock !== undefined) && (
          <div className="flex items-center justify-between">
            <div>
              {medication.pathology && (
                <Badge variant="secondary">
                  {medication.pathology}
                </Badge>
              )}
            </div>
            {medication.total_stock !== undefined && (
              <button
                onClick={onStockClick}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(medication.total_stock, medication.effective_threshold || 10)} hover:opacity-80 transition-opacity cursor-pointer`}
              >
                <Pill className={`h-3 w-3 ${getStockColor(medication.total_stock, medication.effective_threshold || 10)}`} />
                <span className={`text-xs font-semibold ${getStockColor(medication.total_stock, medication.effective_threshold || 10)}`}>
                  {medication.total_stock}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Ligne 3: Posologie */}
        {medication.default_posology && (
          <p className="text-sm text-muted-foreground">
            {medication.default_posology}
          </p>
        )}

        {/* Ligne 4: Description */}
        {medication.description && (
          <p className="text-sm text-muted-foreground">
            {medication.description}
          </p>
        )}
      </div>
    </Card>
  );
}
