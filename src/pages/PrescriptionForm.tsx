import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PrescriptionForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    prescribingDoctorId: "",
    prescriptionDate: "",
    durationDays: 90,
    notes: "",
    medications: [{ name: "", dosage: "" }],
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("health_professionals")
        .select("*")
        .eq("type", "doctor")
        .order("is_primary_doctor", { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error loading doctors:", error);
    }
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: "", dosage: "" }],
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from("prescriptions").insert({
        user_id: user.id,
        prescribing_doctor_id: formData.prescribingDoctorId || null,
        prescription_date: formData.prescriptionDate,
        duration_days: formData.durationDays,
        notes: JSON.stringify(formData.medications) + (formData.notes ? "\n\n" + formData.notes : ""),
      });

      if (error) throw error;

      toast({
        title: "Ordonnance créée",
        description: "L'ordonnance a été enregistrée avec succès.",
      });
      navigate("/prescriptions");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'ordonnance.",
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
            <h1 className="text-2xl font-bold">Nouvelle ordonnance</h1>
            <p className="text-sm text-muted-foreground">Ajoutez une prescription médicale</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Médecin prescripteur</Label>
              <Select 
                value={formData.prescribingDoctorId} 
                onValueChange={(value) => setFormData({ ...formData, prescribingDoctorId: value })}
              >
                <SelectTrigger className="bg-surface">
                  <SelectValue placeholder="Sélectionnez un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.is_primary_doctor && "⭐"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prescription-date">Date de prescription</Label>
                <Input 
                  id="prescription-date" 
                  type="date"
                  value={formData.prescriptionDate}
                  onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
                  className="bg-surface"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durée (QSP en jours)</Label>
                <Input 
                  id="duration" 
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                  className="bg-surface"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Médicaments prescrits</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {formData.medications.map((med, index) => (
                <Card key={index} className="p-3 space-y-3 bg-surface">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium">Médicament {index + 1}</h4>
                    {formData.medications.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Nom du médicament"
                      value={med.name}
                      onChange={(e) => {
                        const newMeds = [...formData.medications];
                        newMeds[index].name = e.target.value;
                        setFormData({ ...formData, medications: newMeds });
                      }}
                      className="bg-background"
                      required
                    />
                    <Input
                      placeholder="Posologie détaillée (ex: 1 comprimé matin et soir)"
                      value={med.dosage}
                      onChange={(e) => {
                        const newMeds = [...formData.medications];
                        newMeds[index].dosage = e.target.value;
                        setFormData({ ...formData, medications: newMeds });
                      }}
                      className="bg-background"
                      required
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes additionnelles</Label>
              <Textarea 
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires"
                className="bg-surface"
              />
            </div>
          </Card>

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
