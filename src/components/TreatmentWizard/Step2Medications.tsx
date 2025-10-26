import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeSelect } from "@/components/ui/time-select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TreatmentFormData, MedicationItem, CatalogMedication } from "./types";
import { supabase } from "@/integrations/supabase/client";
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
      'matin': '09:30',
      'midi': '12:30',
      'apres-midi': '16:00',
      'soir': '19:30',
      'coucher': '22:30',
      'nuit': '03:00'
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

interface Step2MedicationsProps {
  formData: TreatmentFormData;
  setFormData: (data: TreatmentFormData) => void;
}

export function Step2Medications({ formData, setFormData }: Step2MedicationsProps) {
  const [catalog, setCatalog] = useState<CatalogMedication[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [newCustomMed, setNewCustomMed] = useState({ name: "", pathology: "", posology: "", strength: "" });
  const [pathologies, setPathologies] = useState<string[]>([]);
  const [pathologySuggestions, setPathologySuggestions] = useState<string[]>([]);
  const [showPathologySuggestions, setShowPathologySuggestions] = useState(false);

  useEffect(() => {
    loadCatalog();
    loadPathologies();
  }, []);

  const loadCatalog = async () => {
    const { data } = await supabase
      .from("medication_catalog")
      .select("id, name, pathology, description, default_posology, strength, default_times")
      .order("name");
    if (data) setCatalog(data);
  };

  const loadPathologies = async () => {
    const { data } = await supabase
      .from("pathologies")
      .select("name")
      .order("name");
    if (data) {
      setPathologies(data.map(p => p.name));
    }
  };

  const handlePathologyChange = (value: string) => {
    setNewCustomMed({ ...newCustomMed, pathology: value });
    
    if (value.trim().length > 0) {
      const filtered = pathologies.filter(p => 
        p.toLowerCase().startsWith(value.toLowerCase())
      );
      setPathologySuggestions(filtered);
      setShowPathologySuggestions(filtered.length > 0);
    } else {
      setPathologySuggestions([]);
      setShowPathologySuggestions(false);
    }
  };

  const selectPathology = (pathology: string) => {
    setNewCustomMed({ ...newCustomMed, pathology });
    setShowPathologySuggestions(false);
  };

  const addMedicationFromCatalog = (catalogMed: CatalogMedication) => {
    const newMed: MedicationItem = {
      catalogId: catalogMed.id,
      name: catalogMed.name,
      pathology: catalogMed.pathology || "",
      posology: catalogMed.default_posology || "",
      takesPerDay: catalogMed.default_times?.length || 1,
      times: catalogMed.default_times || ["09:00"],
      unitsPerTake: 1,
      minThreshold: 10
    };
    
    setFormData({
      ...formData,
      medications: [...formData.medications, newMed]
    });
    setShowDialog(false);
  };

  const addCustomMedication = async () => {
    if (!newCustomMed.name) return;

    try {
      // Si une pathologie est saisie, vérifier si elle existe, sinon la créer
      if (newCustomMed.pathology && newCustomMed.pathology.trim()) {
        const { data: existingPathology } = await supabase
          .from("pathologies")
          .select("id")
          .ilike("name", newCustomMed.pathology.trim())
          .maybeSingle();

        if (!existingPathology) {
          // Créer la nouvelle pathologie
          await supabase
            .from("pathologies")
            .insert({ name: newCustomMed.pathology.trim() });
        }
      }

      // Parse la posologie pour détecter le nombre de prises et les moments
      const { count: detectedTakes, moments: detectedMoments } = detectTakesFromDosage(newCustomMed.posology || "");
      const defaultTimes = getDefaultTimes(detectedTakes, detectedMoments);

      // Add to catalog
      const { data } = await supabase
        .from("medication_catalog")
        .insert({
          name: newCustomMed.name,
          pathology: newCustomMed.pathology || null,
          default_posology: newCustomMed.posology || null,
          strength: newCustomMed.strength || null,
          default_times: defaultTimes
        })
        .select()
        .single();

      if (data) {
        const newMed: MedicationItem = {
          catalogId: data.id,
          name: data.name,
          pathology: data.pathology || "",
          posology: data.default_posology || "",
          takesPerDay: detectedTakes,
          times: defaultTimes,
          unitsPerTake: 1,
          minThreshold: 10,
          isCustom: true,
        };
        setFormData({ ...formData, medications: [...formData.medications, newMed] });
        setShowCustomDialog(false);
        setNewCustomMed({ name: "", pathology: "", posology: "", strength: "" });
        loadCatalog();
      }
    } catch (error) {
      console.error("Error adding custom medication:", error);
    }
  };

  const updateMedication = (index: number, updates: Partial<MedicationItem>) => {
    const updated = [...formData.medications];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, medications: updated });
  };

  const updateMedicationPosology = (index: number, newPosology: string) => {
    // Parse la posologie pour détecter le nombre de prises et les moments
    const { count: detectedTakes, moments: detectedMoments } = detectTakesFromDosage(newPosology);
    const defaultTimes = getDefaultTimes(detectedTakes, detectedMoments);

    const updated = [...formData.medications];
    updated[index] = { 
      ...updated[index], 
      posology: newPosology,
      takesPerDay: detectedTakes,
      times: defaultTimes
    };
    setFormData({ ...formData, medications: updated });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const addTimeSlot = (medIndex: number) => {
    const updated = [...formData.medications];
    updated[medIndex].times.push("");
    setFormData({ ...formData, medications: updated });
  };

  const updateTimeSlot = (medIndex: number, timeIndex: number, value: string) => {
    const updated = [...formData.medications];
    updated[medIndex].times[timeIndex] = value;
    setFormData({ ...formData, medications: updated });
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowDialog(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomDialog(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer
        </Button>
      </div>

      {formData.medications.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun médicament ajouté</p>
          <p className="text-sm text-muted-foreground mt-2">
            Commencez par ajouter un médicament depuis le référentiel
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {formData.medications.map((med, index) => (
            <Card key={index} className="p-4 space-y-4 bg-card border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">{med.name}</h4>
                    {med.pathology && (
                      <Badge variant="secondary">{med.pathology}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedication(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de prises/jour</Label>
                  <Input
                    id={`takes-per-day-${index}`}
                    type="number"
                    min="1"
                    value={med.takesPerDay}
                    onChange={(e) => {
                      const newTakes = parseInt(e.target.value) || 1;
                      const updated = [...formData.medications];
                      updated[index] = { 
                        ...updated[index], 
                        takesPerDay: newTakes,
                        times: Array(newTakes).fill("").map((_, i) => updated[index].times[i] || "")
                      };
                      setFormData({ ...formData, medications: updated });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unités par prise</Label>
                  <Input
                    id={`units-per-take-${index}`}
                    type="number"
                    min="1"
                    value={med.unitsPerTake}
                    onChange={(e) => updateMedication(index, { unitsPerTake: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{med.times.length === 1 ? "Horaire de prise" : "Horaires de prise"}</Label>
                <div className="grid gap-2">
                  {med.times.map((time, timeIndex) => (
                    <TimeSelect
                      key={`time-${index}-${timeIndex}`}
                      value={time}
                      onValueChange={(value) => updateTimeSlot(index, timeIndex, value)}
                      className="bg-surface"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Posologie détaillée</Label>
                <Input
                  id={`dosage-${index}`}
                  value={med.posology}
                  onChange={(e) => updateMedicationPosology(index, e.target.value)}
                  placeholder="Ex: 1 comprimé matin et soir"
                  className="bg-surface"
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Catalog Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Référentiel de médicaments</DialogTitle>
            <DialogDescription>
              Sélectionner un médicament ou en créer un nouveau.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-80px)] px-6">
            <div className="space-y-3 py-4">
              {catalog.map((med) => (
                <Card
                  key={med.id}
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
                  onClick={() => addMedicationFromCatalog(med)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{med.name}</h4>
                        {med.strength && (
                          <span className="text-sm text-muted-foreground">{med.strength}</span>
                        )}
                      </div>
                      {(med.pathology || med.default_posology) && (
                        <div className="flex items-center gap-2 mb-2">
                          {med.pathology && (
                            <Badge variant="secondary">
                              {med.pathology}
                            </Badge>
                          )}
                          {med.default_posology && (
                            <span className="text-sm text-muted-foreground">{med.default_posology}</span>
                          )}
                        </div>
                      )}
                      {med.description && (
                        <p className="text-sm text-muted-foreground">
                          {med.description}
                        </p>
                      )}
                    </div>
                    <Plus className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Custom Medication Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau médicament</DialogTitle>
            <DialogDescription>
              Ajouter un médicament au catalogue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Première ligne : Nom du médicament + Dosage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du médicament *</Label>
                <Input
                  id="custom-med-name"
                  value={newCustomMed.name}
                  onChange={(e) => setNewCustomMed({ ...newCustomMed, name: e.target.value })}
                  placeholder="Ex: Metformine"
                />
              </div>
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  id="custom-med-dosage-amount"
                  value={newCustomMed.strength || ""}
                  onChange={(e) => setNewCustomMed({ ...newCustomMed, strength: e.target.value })}
                  placeholder="Ex: 850mg"
                />
              </div>
            </div>
            
            {/* Deuxième ligne : Pathologie + Posologie */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label>Pathologie</Label>
                <Input
                  id="custom-med-pathology"
                  value={newCustomMed.pathology}
                  onChange={(e) => handlePathologyChange(e.target.value)}
                  onFocus={() => {
                    if (newCustomMed.pathology.trim().length > 0 && pathologySuggestions.length > 0) {
                      setShowPathologySuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowPathologySuggestions(false), 200);
                  }}
                  placeholder="Ex: Diabète"
                  autoComplete="off"
                />
                {showPathologySuggestions && pathologySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {pathologySuggestions.map((pathology, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                        onClick={() => selectPathology(pathology)}
                      >
                        {pathology}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Posologie</Label>
                <Input
                  id="custom-med-dosage"
                  value={newCustomMed.posology}
                  onChange={(e) => setNewCustomMed({ ...newCustomMed, posology: e.target.value })}
                  placeholder="Ex: 1 comprimé matin et soir"
                />
              </div>
            </div>
            <Button onClick={addCustomMedication} className="w-full">
              Créer et ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
