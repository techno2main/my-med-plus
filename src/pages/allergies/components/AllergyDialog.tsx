import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground px-6">
            {editingItem
              ? "Modifiez les informations de l'allergie"
              : "Ajoutez une nouvelle allergie au référentiel"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
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
