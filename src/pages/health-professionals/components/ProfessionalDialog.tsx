import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import type { HealthProfessional } from "../utils/professionalUtils";

interface ProfessionalDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingItem: HealthProfessional | null;
  formData: {
    name: string;
    type: string;
    specialty: string;
    phone: string;
    email: string;
    street_address: string;
    postal_code: string;
    city: string;
    is_primary_doctor: boolean;
  };
  onFormChange: (data: any) => void;
}

export function ProfessionalDialog({
  open,
  onClose,
  onSubmit,
  editingItem,
  formData,
  onFormChange,
}: ProfessionalDialogProps) {
  const isMedecin = formData.type === "medecin" || formData.type === "doctor";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {editingItem
              ? "Modifiez les informations du professionnel de santé"
              : "Ajoutez un nouveau professionnel de santé"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 max-h-[60vh]">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                placeholder="Nom complet"
                className="bg-surface"
              />
            </div>

            {isMedecin && (
              <div className="space-y-2">
                <Label htmlFor="specialty">Spécialité</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => onFormChange({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Cardiologue"
                  className="bg-surface"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
                placeholder="Ex: 01 23 45 67 89"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
                placeholder="email@exemple.com"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street_address">Adresse</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => onFormChange({ ...formData, street_address: e.target.value })}
                placeholder="Numéro et nom de rue"
                className="bg-surface"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => onFormChange({ ...formData, postal_code: e.target.value })}
                  placeholder="75001"
                  maxLength={5}
                  className="bg-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => onFormChange({ ...formData, city: e.target.value })}
                  placeholder="Paris"
                  className="bg-surface"
                />
              </div>
            </div>

            {isMedecin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="primary"
                  checked={formData.is_primary_doctor}
                  onCheckedChange={(checked) =>
                    onFormChange({ ...formData, is_primary_doctor: checked as boolean })
                  }
                />
                <Label htmlFor="primary" className="cursor-pointer">
                  Médecin traitant
                </Label>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-9">
              Annuler
            </Button>
            <Button onClick={onSubmit} className="flex-1 gradient-primary h-9">
              {editingItem ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
