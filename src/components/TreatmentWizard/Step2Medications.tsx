import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TreatmentFormData, MedicationItem, CatalogMedication } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Step2MedicationsProps {
  formData: TreatmentFormData;
  setFormData: (data: TreatmentFormData) => void;
}

export function Step2Medications({ formData, setFormData }: Step2MedicationsProps) {
  const [catalog, setCatalog] = useState<CatalogMedication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [newCustomMed, setNewCustomMed] = useState({ name: "", pathology: "", dosage: "" });

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    const { data } = await supabase
      .from("medication_catalog")
      .select("*")
      .order("name");
    if (data) setCatalog(data);
  };

  const addMedicationFromCatalog = (catalogMed: CatalogMedication) => {
    const newMed: MedicationItem = {
      catalogId: catalogMed.id,
      name: catalogMed.name,
      pathology: catalogMed.pathology || "",
      dosage: catalogMed.default_dosage || "",
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
        default_dosage: newCustomMed.dosage,
      })
      .select()
      .single();

    if (data) {
      const newMed: MedicationItem = {
        catalogId: data.id,
        name: data.name,
        pathology: data.pathology || "",
        dosage: data.default_dosage || "",
        takesPerDay: 1,
        times: [""],
        unitsPerTake: 1,
        minThreshold: 10,
        isCustom: true,
      };
      setFormData({ ...formData, medications: [...formData.medications, newMed] });
      setShowCustomDialog(false);
      setNewCustomMed({ name: "", pathology: "", dosage: "" });
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

  const filteredCatalog = catalog.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.pathology?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowDialog(true)}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter depuis le référentiel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomDialog(true)}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un médicament
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
                    type="number"
                    min="1"
                    value={med.unitsPerTake}
                    onChange={(e) => updateMedication(index, { unitsPerTake: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Horaires de prise</Label>
                <div className="grid gap-2">
                  {med.times.map((time, timeIndex) => (
                    <Input
                      key={timeIndex}
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, timeIndex, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Posologie détaillée</Label>
                <Input
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, { dosage: e.target.value })}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Référentiel de médicaments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un médicament..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredCatalog.map((med) => (
                  <Card
                    key={med.id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors bg-card border-border"
                    onClick={() => addMedicationFromCatalog(med)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{med.name}</h4>
                        {med.pathology && (
                          <Badge variant="secondary" className="mt-1">
                            {med.pathology}
                          </Badge>
                        )}
                        {med.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {med.description}
                          </p>
                        )}
                      </div>
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Medication Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau médicament</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du médicament *</Label>
              <Input
                value={newCustomMed.name}
                onChange={(e) => setNewCustomMed({ ...newCustomMed, name: e.target.value })}
                placeholder="Ex: Metformine 850mg"
              />
            </div>
            <div className="space-y-2">
              <Label>Pathologie</Label>
              <Input
                value={newCustomMed.pathology}
                onChange={(e) => setNewCustomMed({ ...newCustomMed, pathology: e.target.value })}
                placeholder="Ex: Diabète"
              />
            </div>
            <div className="space-y-2">
              <Label>Posologie par défaut</Label>
              <Input
                value={newCustomMed.dosage}
                onChange={(e) => setNewCustomMed({ ...newCustomMed, dosage: e.target.value })}
                placeholder="Ex: 1 comprimé matin et soir"
              />
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
