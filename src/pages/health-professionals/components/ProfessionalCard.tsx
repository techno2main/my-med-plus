import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Star, Phone, Mail, MapPin } from "lucide-react";
import type { HealthProfessional } from "../utils/professionalUtils";

interface ProfessionalCardProps {
  professional: HealthProfessional;
  onEdit: (professional: HealthProfessional) => void;
  onDelete: (id: string) => void;
}

export function ProfessionalCard({ professional, onEdit, onDelete }: ProfessionalCardProps) {
  return (
    <Card className="p-4 surface-elevated hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{professional.name}</h3>
            {professional.is_primary_doctor && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          {professional.specialty && (
            <Badge variant="secondary" className="mt-1">
              {professional.specialty}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(professional)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(professional.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {professional.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{professional.phone}</span>
          </div>
        )}
        {professional.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{professional.email}</span>
          </div>
        )}
        {(professional.street_address || professional.postal_code || professional.city) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {professional.street_address && (
                <>
                  {professional.street_address}
                  <br />
                </>
              )}
              {(professional.postal_code || professional.city) && (
                <>
                  {professional.postal_code} {professional.city}
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
