import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TimeSelect } from "@/components/ui/time-select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Fonctions utilitaires pour la détection automatique des prises
const detectTakesFromDosage = (posology: string): { count: number; moments: string[] } => {
  const text = posology.toLowerCase().trim();
  
  // 1. Priorité aux indications numériques explicites
  const numericMatch = text.match(/(\d+)\s*(fois|x)\s*(par\s*jour|\/jour)/i);
  if (numericMatch) return { count: parseInt(numericMatch[1]), moments: [] };
  
  // 2. Détection par moments de la journée
  const moments = [];
  if (/matin|matinée|lever|réveil/i.test(text)) moments.push('matin');
  if (/midi|déjeuner/i.test(text)) moments.push('midi');
  if (/après.midi|après midi|aprem|apm/i.test(text)) moments.push('apres-midi');
  if (/soir|soirée/i.test(text)) moments.push('soir');
  if (/coucher/i.test(text)) moments.push('coucher');
  if (/nuit|nocturne/i.test(text)) moments.push('nuit');
  
  if (moments.length > 0) return { count: moments.length, moments };
  
  // 3. Détection par conjonctions
  if (/ et | puis | avec /i.test(text)) {
    return { count: text.split(/ et | puis | avec /i).length, moments: [] };
  }
  
  // 4. Par défaut : 1 prise
  return { count: 1, moments: [] };
};

const getDefaultTimes = (numberOfTakes: number, detectedMoments: string[] = []): string[] => {
  // Si des moments spécifiques ont été détectés, les utiliser
  if (detectedMoments.length > 0) {
    const timeMap: { [key: string]: string } = {
      'matin': '09:30',      // 06:00-11:59 → 09:30
      'midi': '12:30',       // 12:00-12:59 → 12:30
      'apres-midi': '16:00', // 13:00-18:59 → 16:00
      'soir': '19:30',       // 19:00-22:00 → 19:30
      'coucher': '22:30',    // 22:01-23:59 → 22:30
      'nuit': '03:00'        // 00:00-05:59 → 03:00
    };
    
    return detectedMoments.map(moment => timeMap[moment] || '09:30');
  }
  
  // Sinon, utiliser la répartition par défaut
  switch(numberOfTakes) {
    case 1: return ['09:30'];
    case 2: return ['09:30', '19:30'];
    case 3: return ['09:30', '12:30', '19:30'];
    case 4: return ['09:30', '12:30', '16:00', '19:30'];
    default: return Array(numberOfTakes).fill(0).map((_, i) => {
      const hour = 9 + (i * 12 / numberOfTakes);
      return `${Math.floor(hour).toString().padStart(2, '0')}:30`;
    });
  }
};

interface CatalogMedication {
  id: string;
  name: string;
  pathology: string;
  default_posology: string;
  strength?: string;
  initial_stock?: number;
  min_threshold?: number;
}

interface Medication {
  id: string;
  name: string;
  posology: string;
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
  const [posology, setPosology] = useState("");
  const [times, setTimes] = useState<string[]>([]);

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (open) {
      if (medication) {
        // Mode édition
        setSelectedCatalogId(medication.catalog_id || "");
        setPosology(medication.posology);
        setTimes(medication.times || []);
      } else {
        // Mode ajout
        setSelectedCatalogId("");
        setPosology("");
        setTimes([]);
      }
    }
  }, [medication, open]);

  const loadCatalog = async () => {
    const { data, error } = await supabase
      .from("medication_catalog")
      .select("id, name, pathology, default_posology, strength, initial_stock, min_threshold")
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
    if (selected && selected.default_posology) {
      const detectedTakes = detectTakesFromDosage(selected.default_posology);
      const newTimes = getDefaultTimes(detectedTakes.count, detectedTakes.moments);
      setPosology(selected.default_posology);
      setTimes(newTimes);
    }
  };

  const handleSave = async () => {
    if (!selectedCatalogId || !posology || times.length === 0) {
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
            posology,
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
            posology,
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
            <DialogDescription>
              {medication ? "Paramètres du médicament" : "Nouveau médicament"}
            </DialogDescription>
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
                          {med.strength && <span className="text-xs text-muted-foreground">{med.strength}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {med.pathology && <span className="text-xs text-muted-foreground">{med.pathology}</span>}
                          {med.default_posology && <span className="text-xs text-muted-foreground">{med.default_posology}</span>}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Posologie</Label>
              <Input 
                value={posology}
                onChange={(e) => {
                  const newDosage = e.target.value;
                  const detectedTakes = detectTakesFromDosage(newDosage);
                  const newTimes = getDefaultTimes(detectedTakes.count, detectedTakes.moments);
                  setPosology(newDosage);
                  setTimes(newTimes);
                }}
                placeholder="Ex: 1 comprimé matin et soir"
              />
            </div>

            {/* Heures de prises - Design comme dans le référentiel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Horaires de prise</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTimes([...times, "09:30"]);
                  }}
                >
                  + Ajouter
                </Button>
              </div>
              
              {times.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
                  Aucune heure de prise définie
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {times.map((time, index) => (
                    <div key={index} className="flex items-center gap-1 p-2 rounded-md border bg-muted/30">
                      <TimeSelect
                        value={time}
                        onValueChange={(value) => {
                          const newTimes = [...times];
                          newTimes[index] = value;
                          setTimes(newTimes);
                        }}
                        className="bg-surface w-24 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newTimes = times.filter((_, i) => i !== index);
                          setTimes(newTimes);
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
                Ces heures seront utilisées pour les rappels de prise
              </p>
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
