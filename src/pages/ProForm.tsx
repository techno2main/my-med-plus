import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ProForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "doctor",
    name: "",
    specialty: "",
    phone: "",
    email: "",
    address: "",
    isPrimaryDoctor: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Si isPrimaryDoctor est true, désactiver les autres médecins traitants
      if (formData.isPrimaryDoctor && formData.type === "doctor") {
        await supabase
          .from("health_professionals")
          .update({ is_primary_doctor: false })
          .eq("user_id", user.id)
          .eq("type", "doctor")
          .eq("is_primary_doctor", true);
      }

      const { error } = await supabase.from("health_professionals").insert({
        user_id: user.id,
        type: formData.type,
        name: formData.name,
        specialty: formData.specialty,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        is_primary_doctor: formData.isPrimaryDoctor,
      });

      if (error) throw error;

      toast({
        title: "Professionnel ajouté",
        description: "Le contact a été enregistré avec succès.",
      });
      navigate("/pros");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le professionnel.",
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
            <h1 className="text-2xl font-bold">Nouveau professionnel</h1>
            <p className="text-sm text-muted-foreground">Ajoutez un contact médical</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="bg-surface">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Médecin</SelectItem>
                  <SelectItem value="pharmacy">Pharmacie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "doctor" && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                <Label htmlFor="isPrimaryDoctor" className="cursor-pointer">
                  Médecin traitant
                </Label>
                <Switch
                  id="isPrimaryDoctor"
                  checked={formData.isPrimaryDoctor}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrimaryDoctor: checked })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Nom Prénom ou Nom de l'établissement"
                className="bg-surface"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité</Label>
              <Input 
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Ex: Médecin généraliste, Cardiologue..."
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@exemple.fr"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea 
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse complète"
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
