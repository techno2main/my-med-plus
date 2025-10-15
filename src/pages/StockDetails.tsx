import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Calendar, TrendingDown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StockDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [medication, setMedication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMedication();
    }
  }, [id]);

  const loadMedication = async () => {
    try {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setMedication(data);
    } catch (error) {
      console.error("Error loading medication:", error);
      toast.error("Erreur lors du chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (currentStock: number, minThreshold: number) => {
    if (currentStock === 0) return "critical";
    if (currentStock <= minThreshold * 0.5) return "critical";
    if (currentStock <= minThreshold) return "low";
    return "ok";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge variant="success">Stock OK</Badge>;
      case "low":
        return <Badge variant="warning">Stock bas</Badge>;
      case "critical":
        return <Badge variant="danger">Critique</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!medication) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Médicament non trouvé</p>
        </div>
      </AppLayout>
    );
  }

  const currentStock = medication.current_stock || 0;
  const minThreshold = medication.min_threshold || 10;
  const status = getStockStatus(currentStock, minThreshold);
  const dailyConsumption = medication.times?.length || 1;
  const estimatedDaysLeft = currentStock > 0 ? Math.floor(currentStock / dailyConsumption) : 0;

  return (
    <AppLayout showBottomNav={false}>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{medication.name}</h1>
            <p className="text-muted-foreground">Détails du stock</p>
          </div>
        </div>

        {/* Statut actuel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">État du stock</h3>
            </div>
            {getStatusBadge(status)}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stock actuel</p>
              <p className="text-3xl font-bold text-primary">
                {currentStock}
              </p>
              <p className="text-sm text-muted-foreground">unités</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Seuil minimum</p>
              <p className="text-3xl font-bold">
                {minThreshold}
              </p>
              <p className="text-sm text-muted-foreground">unités</p>
            </div>
          </div>
        </Card>

        {/* Prévisions */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Prévisions</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <div>
                <p className="text-sm text-muted-foreground">Prises par jour</p>
                <p className="font-semibold">{dailyConsumption} prise(s)/jour</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <div>
                <p className="text-sm text-muted-foreground">Jours restants estimés</p>
                <p className="font-semibold">{estimatedDaysLeft} jours</p>
              </div>
            </div>

            {medication.expiry_date && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'expiration</p>
                    <p className="font-semibold">
                      {new Date(medication.expiry_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>


        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => navigate(`/stock/adjust?id=${id}`)}>
            Ajuster le stock
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
