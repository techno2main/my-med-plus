import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Calendar, TrendingDown, AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function StockDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data - remplacer par vraies données
  const stockItem = {
    id: 1,
    medication: "Metformine 850mg",
    currentStock: 15,
    minThreshold: 10,
    unit: "comprimés",
    expiryDate: "2025-12-31",
    dailyConsumption: 2,
    estimatedDaysLeft: 7,
    status: "ok",
    history: [
      { date: "2025-01-10", action: "Ajout", quantity: 30, note: "Achat pharmacie" },
      { date: "2025-01-08", action: "Consommation", quantity: -15, note: "Traitement régulier" },
    ]
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

  return (
    <AppLayout showBottomNav={false}>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{stockItem.medication}</h1>
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
            {getStatusBadge(stockItem.status)}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stock actuel</p>
              <p className="text-3xl font-bold text-primary">
                {stockItem.currentStock}
              </p>
              <p className="text-sm text-muted-foreground">{stockItem.unit}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Seuil minimum</p>
              <p className="text-3xl font-bold">
                {stockItem.minThreshold}
              </p>
              <p className="text-sm text-muted-foreground">{stockItem.unit}</p>
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
                <p className="text-sm text-muted-foreground">Consommation journalière</p>
                <p className="font-semibold">{stockItem.dailyConsumption} {stockItem.unit}/jour</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <div>
                <p className="text-sm text-muted-foreground">Jours restants estimés</p>
                <p className="font-semibold">{stockItem.estimatedDaysLeft} jours</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date d'expiration</p>
                  <p className="font-semibold">
                    {new Date(stockItem.expiryDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Historique */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Historique des mouvements</h3>
          <div className="space-y-3">
            {stockItem.history.map((entry, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-surface">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{entry.action}</p>
                    <Badge variant={entry.quantity > 0 ? "success" : "muted"}>
                      {entry.quantity > 0 ? "+" : ""}{entry.quantity} {stockItem.unit}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.note}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => navigate("/stock/adjust")}>
            Ajuster le stock
          </Button>
          <Button variant="outline" className="flex-1">
            Modifier le seuil
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
