import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Package } from "lucide-react";

export default function Stock() {
  // Mock data - à remplacer par des vraies données
  const stockItems = [
    {
      id: 1,
      medication: "Metformine 850mg",
      currentStock: 15,
      minThreshold: 10,
      unit: "comprimés",
      expiryDate: "2025-12-31",
      status: "ok"
    },
    {
      id: 2,
      medication: "Atorvastatine 20mg",
      currentStock: 8,
      minThreshold: 10,
      unit: "comprimés",
      expiryDate: "2025-08-15",
      status: "low"
    },
    {
      id: 3,
      medication: "Zolpidem 10mg",
      currentStock: 3,
      minThreshold: 5,
      unit: "comprimés",
      expiryDate: "2025-06-20",
      status: "critical"
    },
  ];

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
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock</h1>
            <p className="text-muted-foreground">Gérez vos stocks de médicaments</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {/* Alertes */}
        <div className="space-y-3">
          <Card className="p-4 border-warning bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-warning">2 médicaments nécessitent un réapprovisionnement</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Atorvastatine et Zolpidem sont en stock bas
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Liste du stock */}
        <div className="space-y-4">
          {stockItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{item.medication}</h3>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Stock actuel</p>
                  <p className="font-medium text-lg">
                    {item.currentStock} {item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seuil minimum</p>
                  <p className="font-medium text-lg">
                    {item.minThreshold} {item.unit}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Date d'expiration</p>
                  <p className="font-medium">{new Date(item.expiryDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  Ajuster stock
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Détails
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}