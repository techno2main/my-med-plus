import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CatalogMedication {
  id: string;
  name: string;
  pathology: string;
  default_dosage: string;
  dosage_amount?: string;
  initial_stock?: number;
  min_threshold?: number;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  catalog_id?: string;
}

interface MedicationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication | null;
  treatmentId: string;
  onSave: () => void;
}

export function MedicationEditDialog({ open, onOpenChange, medication, treatmentId, onSave }: MedicationEditDialogProps) {
  const [catalog, setCatalog] = useState<CatalogMedication[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (open) {
      if (medication) {
        // Mode édition
        setSelectedCatalogId(medication.catalog_id || "");
        setDosage(medication.dosage);
        setTimes(medication.times || []);
      } else {
        // Mode ajout
        setSelectedCatalogId("");
        setDosage("");
        setTimes([]);
      }
    }
  }, [medication, open]);

  const loadCatalog = async () => {
    const { data, error } = await supabase
      .from("medication_catalog")
      .select("id, name, pathology, default_dosage, dosage_amount, initial_stock, min_threshold")
      .order("name");

    if (error) {
      toast.error("Erreur lors du chargement du référentiel");
      return;
    }

    setCatalog(data || []);
  };

  const handleCatalogChange = (catalogId: string) => {
    setSelectedCatalogId(catalogId);
    const selected = catalog.find(c => c.id === catalogId);
    if (selected) {
      setDosage(selected.default_dosage);
    }
  };

  const addTime = () => {
    if (newTime && !times.includes(newTime)) {
      setTimes([...times, newTime]);
      setNewTime("");
    }
  };

  const removeTime = (time: string) => {
    setTimes(times.filter(t => t !== time));
  };

  const handleSave = async () => {
    if (!selectedCatalogId || !dosage || times.length === 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const selectedMed = catalog.find(c => c.id === selectedCatalogId);
    if (!selectedMed) return;

    try {
      if (medication) {
        // Mode édition
        const { error } = await supabase
          .from("medications")
          .update({
            catalog_id: selectedCatalogId,
            name: selectedMed.name,
            dosage,
            times
          })
          .eq("id", medication.id);

        if (error) throw error;
        toast.success("Médicament mis à jour");
      } else {
        // Mode ajout
        const { error } = await supabase
          .from("medications")
          .insert({
            treatment_id: treatmentId,
            catalog_id: selectedCatalogId,
            name: selectedMed.name,
            dosage,
            times,
            current_stock: selectedMed.initial_stock || 0,
            min_threshold: selectedMed.min_threshold || 10
          });

        if (error) throw error;
        toast.success("Médicament ajouté");
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving medication:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>{medication ? "Modifier" : "Ajouter"}</DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Médicament du référentiel</Label>
              <Select value={selectedCatalogId} onValueChange={handleCatalogChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un médicament" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover z-50">
                  {catalog.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{med.name}</span>
                          {med.dosage_amount && <span className="text-xs text-muted-foreground">{med.dosage_amount}</span>}
                        </div>
                        {med.pathology && (
                          <span className="text-xs text-muted-foreground">{med.pathology}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Posologie</Label>
              <Input 
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Ex: 1 comprimé matin et soir"
              />
            </div>

            <div className="space-y-2">
              <Label>Horaires de prise</Label>
              <div className="flex gap-2">
                <Input 
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
                <Button type="button" onClick={addTime}>Ajouter</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {times.map((time) => (
                  <div key={time} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10">
                    <span className="text-sm font-medium">{time}</span>
                    <button onClick={() => removeTime(time)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-9">
              Annuler
            </Button>
            <Button onClick={handleSave} className="flex-1 gradient-primary h-9">
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
