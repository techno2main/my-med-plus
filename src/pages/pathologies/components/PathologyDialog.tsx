import { FormDialog } from "@/components/ui/organisms/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Pathology } from "../utils/pathologyUtils";

interface PathologyDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingItem: Pathology | null;
  formData: {
    name: string;
    description: string;
  };
  onFormChange: (data: { name: string; description: string }) => void;
}

export function PathologyDialog({
  open,
  onClose,
  onSubmit,
  editingItem,
  formData,
  onFormChange,
}: PathologyDialogProps) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editingItem ? "Modifier une Pathologie" : "Ajouter une Pathologie"}
      submitLabel={editingItem ? "Modifier" : "Ajouter"}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom de la pathologie *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            placeholder="Ex: Diabète Type 2"
            className="bg-surface"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            placeholder="Description de la pathologie..."
            className="bg-surface"
          />
        </div>
      </div>
    </FormDialog>
  );
}
