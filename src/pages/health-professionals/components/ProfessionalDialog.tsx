import { FormDialog } from "@/components/ui/organisms/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const isPharmacie = formData.type === "pharmacie" || formData.type === "pharmacy";
  const isLaboratoire = formData.type === "laboratoire" || formData.type === "laboratory";

  const getTypeLabel = () => {
    if (isMedecin) return { article: "un", label: "Médecin" };
    if (isPharmacie) return { article: "une", label: "Pharmacie" };
    if (isLaboratoire) return { article: "un", label: "Laboratoire" };
    return { article: "un", label: "professionnel de santé" };
  };

  const typeInfo = getTypeLabel();

  const getDescription = () => {
    if (editingItem) {
      return `Modifiez les informations de ${typeInfo.article === "une" ? "cette" : "ce"} ${typeInfo.label.toLowerCase()}`;
    }
    return `Ajoutez ${typeInfo.article} nouveau${typeInfo.article === "une" ? "le" : ""} ${typeInfo.label.toLowerCase()} à votre carnet de santé`;
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={
        editingItem
          ? `Modifier ${typeInfo.article} ${typeInfo.label}`
          : `Ajouter ${typeInfo.article} ${typeInfo.label}`
      }
      description={getDescription()}
      onSubmit={onSubmit}
      submitLabel={editingItem ? "Modifier" : "Ajouter"}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            placeholder="Dr. Prénom NOM"
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
    </FormDialog>
  );
}
