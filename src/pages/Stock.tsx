import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Stock() {
  const navigate = useNavigate();

  // Récupération des médicaments depuis les traitements actifs
  const { data: medications, isLoading } = useQuery({
    queryKey: ["medications-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select(`
          *,
          treatments!inner(is_active),
          medication_catalog(strength, default_posology)
        `)
        .eq("treatments.is_active", true)
        .order("name");
      
      if (error) throw error;
      
      return data;
    },
  });

  // Calcul du statut du stock
  const getStockStatus = (currentStock: number, minThreshold: number) => {
    if (currentStock === 0) return "critical";
    if (currentStock <= minThreshold) return "low";
    return "ok";
  };

  const stockItems = medications?.map(med => ({
    ...med,
    medication: med.name,
    dosage: med.medication_catalog?.strength || med.medication_catalog?.default_posology || "",
    unit: "unités",
    status: getStockStatus(med.current_stock || 0, med.min_threshold || 10)
  })) || [];

  const lowStockCount = stockItems.filter(item => item.status === "low" || item.status === "critical").length;

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Stocks"
          subtitle="Gérer les stocks des médicaments"
        />

        {/* Alertes */}
        {lowStockCount > 0 && (
          <div className="space-y-3">
            <Card className="p-4 border-warning bg-warning/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-warning">
                    {lowStockCount} médicament{lowStockCount > 1 ? "s" : ""} nécessite{lowStockCount > 1 ? "nt" : ""} un réapprovisionnement
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stock bas ou critique détecté
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Liste du stock */}
        <div className="space-y-4">
          {stockItems.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun médicament en stock</p>
            </Card>
          ) : (
            stockItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{item.medication}</h3>
                      {item.dosage && <span className="text-xs text-muted-foreground">{item.dosage}</span>}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm ml-6">
                    <div>
                      <p className="text-muted-foreground">Stock actuel</p>
                      <p className="font-medium text-base">
                        {item.current_stock || 0} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Seuil minimum</p>
                      <p className="font-medium text-base">
                        {item.min_threshold || 10} {item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs justify-start pl-4" 
                      onClick={() => navigate(`/stock/adjust?id=${item.id}`)}
                    >
                      Ajuster stock
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs justify-start pl-4" 
                      onClick={() => navigate(`/stock/${item.id}`)}
                    >
                      Détails
                    </Button>
                  </div>

                  {item.expiry_date && (
                    <div className="ml-6">
                      <p className="text-muted-foreground text-sm">Date d'expiration</p>
                      <p className="font-medium">{new Date(item.expiry_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}