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

interface Step2MedicationsProps {
  formData: TreatmentFormData;
  setFormData: (data: TreatmentFormData) => void;
}

export function Step2Medications({ formData, setFormData }: Step2MedicationsProps) {
  const [catalog, setCatalog] = useState<CatalogMedication[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [newCustomMed, setNewCustomMed] = useState({ name: "", pathology: "", posology: "", strength: "" });

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    const { data } = await supabase
      .from("medication_catalog")
      .select("id, name, pathology, description, default_posology, strength, default_times")
      .order("name");
    if (data) setCatalog(data);
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

    // Add to catalog
    const { data } = await supabase
      .from("medication_catalog")
      .insert({
        name: newCustomMed.name,
        pathology: newCustomMed.pathology,
        default_posology: newCustomMed.posology,
      })
      .select()
      .single();

    if (data) {
      const newMed: MedicationItem = {
        catalogId: data.id,
        name: data.name,
        pathology: data.pathology || "",
        posology: data.default_posology || "",
        takesPerDay: 1,
        times: [""],
        unitsPerTake: 1,
        minThreshold: 10,
        isCustom: true,
      };
      setFormData({ ...formData, medications: [...formData.medications, newMed] });
      setShowCustomDialog(false);
      setNewCustomMed({ name: "", pathology: "", posology: "", strength: "" });
      loadCatalog();
    }
  };

  const updateMedication = (index: number, updates: Partial<MedicationItem>) => {
    const updated = [...formData.medications];
    updated[index] = { ...updated[index], ...updates };
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
                  onChange={(e) => updateMedication(index, { posology: e.target.value })}
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
              Sélectionnez un médicament dans le catalogue ou créez-en un nouveau.
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
              Ajoutez un médicament personnalisé qui ne figure pas dans le catalogue.
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
              <div className="space-y-2">
                <Label>Pathologie</Label>
                <Input
                  id="custom-med-pathology"
                  value={newCustomMed.pathology}
                  onChange={(e) => setNewCustomMed({ ...newCustomMed, pathology: e.target.value })}
                  placeholder="Ex: Diabète"
                />
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
