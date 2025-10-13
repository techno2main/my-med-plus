import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths } from "date-fns";

export default function TreatmentForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [formData, setFormData] = useState({
    prescriptionId: "",
    pharmacyId: "",
    firstPharmacyVisit: "",
    name: "",
    pathology: "",
    startDate: "",
    notes: "",
  });
  const [medications, setMedications] = useState([
    { name: "", dosage: "", times: [""], initialStock: 0, minThreshold: 10 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.prescriptionId) {
      const prescription = prescriptions.find(p => p.id === formData.prescriptionId);
      setSelectedPrescription(prescription);
      
      if (prescription) {
        try {
          const meds = JSON.parse(prescription.notes || "[]");
          if (Array.isArray(meds) && meds.length > 0) {
            setMedications(meds.map((m: any) => ({
              name: m.name || "",
              dosage: m.dosage || "",
              times: [""],
              initialStock: 0,
              minThreshold: 10
            })));
          }
        } catch (e) {
          console.error("Error parsing medications:", e);
        }
      }
    }
  }, [formData.prescriptionId, prescriptions]);

  const loadData = async () => {
    try {
      const [prescData, pharmacyData] = await Promise.all([
        supabase.from("prescriptions").select("*, health_professionals(name)").order("created_at", { ascending: false }),
        supabase.from("health_professionals").select("*").eq("type", "pharmacy")
      ]);

      if (prescData.error) throw prescData.error;
      if (pharmacyData.error) throw pharmacyData.error;

      setPrescriptions(prescData.data || []);
      setPharmacies(pharmacyData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", times: [""], initialStock: 0, minThreshold: 10 }]);
  };

  const addTime = (medIndex: number) => {
    const newMeds = [...medications];
    newMeds[medIndex].times.push("");
    setMedications(newMeds);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Créer le traitement
      const { data: treatment, error: treatmentError } = await supabase
        .from("treatments")
        .insert({
          user_id: user.id,
          prescription_id: formData.prescriptionId,
          pharmacy_id: formData.pharmacyId || null,
          name: formData.name,
          pathology: formData.pathology,
          start_date: formData.startDate,
          notes: formData.notes,
        })
        .select()
        .single();

      if (treatmentError) throw treatmentError;

      // Créer les médicaments
      const medicationsToInsert = medications.map(med => ({
        treatment_id: treatment.id,
        name: med.name,
        dosage: med.dosage,
        times: med.times.filter(t => t !== ""),
        initial_stock: med.initialStock,
        current_stock: med.initialStock,
        min_threshold: med.minThreshold,
      }));

      const { error: medError } = await supabase
        .from("medications")
        .insert(medicationsToInsert);

      if (medError) throw medError;

      // Créer les visites en pharmacie (3 visites espacées d'1 mois)
      if (formData.firstPharmacyVisit && formData.pharmacyId) {
        const visits = [];
        const firstVisitDate = new Date(formData.firstPharmacyVisit);
        
        for (let i = 0; i < 3; i++) {
          visits.push({
            treatment_id: treatment.id,
            pharmacy_id: formData.pharmacyId,
            visit_date: format(addMonths(firstVisitDate, i), "yyyy-MM-dd"),
            visit_number: i + 1,
            is_completed: i === 0,
          });
        }

        const { error: visitsError } = await supabase
          .from("pharmacy_visits")
          .insert(visits);

        if (visitsError) throw visitsError;
      }

      toast({
        title: "Traitement créé",
        description: "Le traitement et les visites en pharmacie ont été planifiés.",
      });
      navigate("/");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le traitement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouveau traitement</h1>
            <p className="text-sm text-muted-foreground">Ajoutez un traitement médical</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prescription">Ordonnance de référence</Label>
              <Select 
                value={formData.prescriptionId} 
                onValueChange={(value) => setFormData({ ...formData, prescriptionId: value })}
              >
                <SelectTrigger className="bg-surface">
                  <SelectValue placeholder="Sélectionnez une ordonnance" />
                </SelectTrigger>
                <SelectContent>
                  {prescriptions.map((presc) => (
                    <SelectItem key={presc.id} value={presc.id}>
                      {format(new Date(presc.prescription_date), "dd/MM/yyyy")} - {presc.health_professionals?.name || "Médecin"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment-name">Nom du traitement</Label>
              <Input 
                id="treatment-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Diabète Type 2"
                className="bg-surface"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pathology">Pathologie</Label>
              <Input 
                id="pathology"
                value={formData.pathology}
                onChange={(e) => setFormData({ ...formData, pathology: e.target.value })}
                placeholder="Ex: Diabète, Cholestérol..."
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début du traitement</Label>
              <Input 
                id="start-date" 
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-surface"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacy">Pharmacie de délivrance</Label>
              <Select 
                value={formData.pharmacyId} 
                onValueChange={(value) => setFormData({ ...formData, pharmacyId: value })}
              >
                <SelectTrigger className="bg-surface">
                  <SelectValue placeholder="Sélectionnez une pharmacie" />
                </SelectTrigger>
                <SelectContent>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first-visit">Première visite en pharmacie</Label>
              <Input 
                id="first-visit" 
                type="date"
                value={formData.firstPharmacyVisit}
                onChange={(e) => setFormData({ ...formData, firstPharmacyVisit: e.target.value })}
                className="bg-surface"
              />
              <p className="text-xs text-muted-foreground">
                Les 2 prochaines visites seront automatiquement planifiées à 1 mois d'intervalle
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                className="bg-surface min-h-[100px]"
              />
            </div>
          </Card>

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Médicaments du traitement</h3>
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {medications.map((med, medIndex) => (
              <Card key={medIndex} className="p-4 space-y-4 bg-surface">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm">Médicament {medIndex + 1}</h4>
                  {medications.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeMedication(medIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`med-name-${medIndex}`}>Nom du médicament</Label>
                  <Input 
                    id={`med-name-${medIndex}`}
                    value={med.name}
                    onChange={(e) => {
                      const newMeds = [...medications];
                      newMeds[medIndex].name = e.target.value;
                      setMedications(newMeds);
                    }}
                    placeholder="Ex: Metformine 850mg"
                    className="bg-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`dosage-${medIndex}`}>Posologie</Label>
                  <Input 
                    id={`dosage-${medIndex}`}
                    value={med.dosage}
                    onChange={(e) => {
                      const newMeds = [...medications];
                      newMeds[medIndex].dosage = e.target.value;
                      setMedications(newMeds);
                    }}
                    placeholder="Ex: 1 comprimé matin et soir"
                    className="bg-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horaires de prise</Label>
                  {med.times.map((time, timeIndex) => (
                    <Input 
                      key={timeIndex}
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newMeds = [...medications];
                        newMeds[medIndex].times[timeIndex] = e.target.value;
                        setMedications(newMeds);
                      }}
                      className="bg-background"
                    />
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => addTime(medIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un horaire
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`stock-${medIndex}`}>Stock initial</Label>
                    <Input 
                      id={`stock-${medIndex}`}
                      type="number"
                      value={med.initialStock}
                      onChange={(e) => {
                        const newMeds = [...medications];
                        newMeds[medIndex].initialStock = parseInt(e.target.value) || 0;
                        setMedications(newMeds);
                      }}
                      placeholder="Nombre"
                      className="bg-background"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`threshold-${medIndex}`}>Seuil d'alerte</Label>
                    <Input 
                      id={`threshold-${medIndex}`}
                      type="number"
                      value={med.minThreshold}
                      onChange={(e) => {
                        const newMeds = [...medications];
                        newMeds[medIndex].minThreshold = parseInt(e.target.value) || 0;
                        setMedications(newMeds);
                      }}
                      placeholder="Min"
                      className="bg-background"
                      min="0"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gradient-primary"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
