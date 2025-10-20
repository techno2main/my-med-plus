import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StockForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const medicationId = searchParams.get("id");
  
  const [loading, setLoading] = useState(true);
  const [medication, setMedication] = useState<any>(null);
  const [dosage, setDosage] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [minThreshold, setMinThreshold] = useState("");

  useEffect(() => {
    if (medicationId) {
      loadMedication();
    }
  }, [medicationId]);

  const loadMedication = async () => {
    try {
      const { data, error } = await supabase
        .from("medications")
        .select(`
          *,
          medication_catalog(strength, default_posology)
        `)
        .eq("id", medicationId)
        .single();

      if (error) throw error;
      
      setMedication(data);
      setDosage(data.medication_catalog?.strength || data.medication_catalog?.default_posology || "");
      setExpiryDate(data.expiry_date || "");
      setMinThreshold(String(data.min_threshold || 10));
    } catch (error) {
      console.error("Error loading medication:", error);
      toast.error("Erreur lors du chargement du médicament");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medication) return;

    const adjustmentValue = parseInt(adjustment) || 0;
    const newStock = (medication.current_stock || 0) + adjustmentValue;

    if (newStock < 0) {
      toast.error("Le stock ne peut pas être négatif");
      return;
    }

    try {
      const { error } = await supabase
        .from("medications")
        .update({
          current_stock: newStock,
          expiry_date: expiryDate || null,
          min_threshold: parseInt(minThreshold) || 10,
          updated_at: new Date().toISOString()
        })
        .eq("id", medicationId);

      if (error) throw error;

      toast.success("Stock mis à jour avec succès");
      navigate("/stock");
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Erreur lors de la mise à jour du stock");
    }
  };

  const currentStock = medication?.current_stock || 0;
  const newStock = currentStock + (parseInt(adjustment) || 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!medication) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Médicament non trouvé</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/stock")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ajuster le stock</h1>
            <p className="text-sm text-muted-foreground">Modifiez la quantité en stock</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Médicament</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">{medication.name}</span>
                {dosage && <span className="text-sm text-muted-foreground">{dosage}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-stock">Stock actuel</Label>
                <Input 
                  id="current-stock" 
                  type="number"
                  value={currentStock}
                  className="bg-surface"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustment">Ajustement *</Label>
                <Input 
                  id="adjustment" 
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                  placeholder="+10 ou -5"
                  required
                  autoFocus
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground -mt-2">
              Entrez un nombre positif (+10) ou négatif (-5)
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-stock">Nouveau stock</Label>
                <Input 
                  id="new-stock" 
                  type="number"
                  value={newStock}
                  className="bg-surface"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-threshold">Seuil d'alerte</Label>
                <Input 
                  id="min-threshold" 
                  type="number"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate("/stock")}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gradient-primary"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
