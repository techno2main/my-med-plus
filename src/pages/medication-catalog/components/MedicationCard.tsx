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
    pathology_id?: string | null;
    pathologies?: {
      id: string;
      name: string;
      description?: string | null;
    } | null;
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

        {/* Ligne 2: Pathologie */}
        {medication.pathologies && (
          <div>
            <Badge variant="secondary">
              {medication.pathologies.name}
            </Badge>
          </div>
        )}

        {/* Ligne 3: Description (substance active) */}
        {medication.description && (
          <p className="text-sm text-muted-foreground">
            {medication.description}
          </p>
        )}
      </div>
    </Card>
  );
}
