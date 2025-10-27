import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSelect } from "@/components/ui/time-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Pill } from "lucide-react";
import { detectTakesFromDosage, getDefaultTimes, generateDosageFromTimes } from "../utils/medicationUtils";

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMed: any | null;
  formData: {
    name: string;
    pathology: string;
    default_posology: string;
    strength: string;
    description: string;
    initial_stock: string;
    min_threshold: string;
    default_times: string[];
  };
  setFormData: (data: any) => void;
  pathologies: { id: string; name: string }[];
  onSubmit: () => void;
  onStockClick: (id: string) => void;
}

export function MedicationDialog({
  open,
  onOpenChange,
  editingMed,
  formData,
  setFormData,
  pathologies,
  onSubmit,
  onStockClick,
}: MedicationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>
              {editingMed ? "Modifier" : "Ajouter"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {editingMed 
              ? "Modifier les informations du médicament"
              : "Ajoutez un nouveau médicament au référentiel"
            }
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4 pb-8">
            {/* Première ligne : Nom + Dosage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du médicament *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Xigduo"
                  className="bg-surface"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strength">Force</Label>
                <Input
                  id="strength"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="Ex: 5mg/1000mg"
                  className="bg-surface"
                />
              </div>
            </div>

            {/* Deuxième ligne : Pathologie seule */}
            <div className="space-y-2">
              <Label htmlFor="pathology">Pathologie</Label>
              <Select value={formData.pathology} onValueChange={(value) => setFormData({ ...formData, pathology: value })}>
                <SelectTrigger className="bg-surface">
                  <SelectValue placeholder="Sélectionner une pathologie" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {pathologies.map((pathology) => (
                    <SelectItem key={pathology.id} value={pathology.name}>
                      {pathology.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Metformine"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Posologie</Label>
              <Input
                id="dosage"
                value={formData.default_posology}
                onChange={(e) => {
                  const newDosage = e.target.value.trim();
                  
                  // Si le champ est vidé manuellement
                  if (newDosage === "") {
                    setFormData({ 
                      ...formData, 
                      default_posology: "Définir une ou plusieurs prises",
                      default_times: []
                    });
                    return;
                  }
                  
                  // Sinon, détection automatique normale
                  const detectedTakes = detectTakesFromDosage(newDosage);
                  const newTimes = getDefaultTimes(detectedTakes.count, detectedTakes.moments);
                  setFormData({ 
                    ...formData, 
                    default_posology: newDosage,
                    default_times: newTimes
                  });
                }}
                placeholder="Ex: 1 comprimé matin et soir"
                className="bg-surface"
              />
            </div>

            {/* Heures de prises - Design compact */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Heures de prises par défaut</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({ ...formData, default_times: [...formData.default_times, "09:00"] });
                  }}
                >
                  + Ajouter
                </Button>
              </div>
              
              {formData.default_times.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
                  Aucune heure de prise définie
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.default_times.map((time, index) => (
                    <div key={index} className="flex items-center gap-1 p-2 rounded-md border bg-muted/30">
                      <TimeSelect
                        value={time}
                        onValueChange={(value) => {
                          const newTimes = [...formData.default_times];
                          newTimes[index] = value;
                          const newDosage = generateDosageFromTimes(newTimes);
                          setFormData({ 
                            ...formData, 
                            default_times: newTimes,
                            default_posology: newDosage
                          });
                        }}
                        className="bg-surface w-24 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newTimes = formData.default_times.filter((_, i) => i !== index);
                          const newDosage = generateDosageFromTimes(newTimes);
                          setFormData({ 
                            ...formData, 
                            default_times: newTimes,
                            default_posology: newDosage
                          });
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Ces heures seront pré-remplies lors de l'ajout d'un traitement
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial_stock">Stock initial</Label>
                <Input
                  id="initial_stock"
                  type="number"
                  min="0"
                  value={formData.initial_stock}
                  onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                  placeholder="0"
                  className="bg-surface"
                  disabled={!!editingMed}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_threshold">Seuil minimum</Label>
                <Input
                  id="min_threshold"
                  type="number"
                  min="0"
                  value={formData.min_threshold}
                  onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                  placeholder="10"
                  className="bg-surface"
                  disabled={!!editingMed}
                />
              </div>
            </div>

            {editingMed && editingMed.total_stock !== undefined && (
              <div className={`p-3 rounded-lg border ${
                editingMed.total_stock === 0 
                  ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
                  : editingMed.total_stock <= (editingMed.min_threshold || 10)
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30'
                  : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
              }`}>
                <p className="text-sm text-muted-foreground mb-1">Stock actuel total</p>
                <button 
                  onClick={() => onStockClick(editingMed.id)}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Pill className={`h-4 w-4 ${
                    editingMed.total_stock === 0 
                      ? 'text-red-600 dark:text-red-400'
                      : editingMed.total_stock <= (editingMed.min_threshold || 10)
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                  <span className={`text-base font-semibold ${
                    editingMed.total_stock === 0 
                      ? 'text-red-600 dark:text-red-400'
                      : editingMed.total_stock <= (editingMed.min_threshold || 10)
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>{editingMed.total_stock} unités</span>
                </button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-9">
              Annuler
            </Button>
            <Button onClick={onSubmit} className="flex-1 gradient-primary h-9">
              {editingMed ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
