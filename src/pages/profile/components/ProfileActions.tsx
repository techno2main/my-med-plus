import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ProfileActionsProps {
  isEditing: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileActions({
  isEditing,
  saving,
  onCancel,
  onSave,
}: ProfileActionsProps) {
  if (!isEditing) return null;

  return (
    <div className="flex gap-2 mt-6">
      <Button 
        variant="outline" 
        className="flex-1" 
        onClick={onCancel} 
        disabled={saving}
      >
        Annuler
      </Button>
      <Button 
        className="flex-1" 
        onClick={onSave} 
        disabled={saving}
      >
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}
