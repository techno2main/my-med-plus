import { FormDialog } from "@/components/ui/organisms/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Allergy } from "../utils/allergyUtils";

interface AllergyDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingItem: Allergy | null;
  formData: {
    name: string;
    severity: string;
    description: string;
  };
  onFormChange: (data: { name: string; severity: string; description: string }) => void;
}

export function AllergyDialog({
  open,
  onClose,
  onSubmit,
  editingItem,
  formData,
  onFormChange,
}: AllergyDialogProps) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editingItem ? "Modifier une Allergie" : "Ajouter une Allergie"}
      submitLabel={editingItem ? "Modifier" : "Ajouter"}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom de l'allergie *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            placeholder="Ex: Arachides"
            className="bg-surface"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Sévérité</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) => onFormChange({ ...formData, severity: value })}
          >
            <SelectTrigger id="severity" className="bg-surface">
              <SelectValue placeholder="Sélectionner la sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Légère">Légère</SelectItem>
              <SelectItem value="Modérée">Modérée</SelectItem>
              <SelectItem value="Sévère">Sévère</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            placeholder="Description de l'allergie..."
            className="bg-surface min-h-[100px]"
          />
        </div>
      </div>
    </FormDialog>
  );
}
