import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, Eye, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Prescriptions() {
  const navigate = useNavigate();
  // Mock data - à remplacer par des vraies données
  const prescriptions = [
    {
      id: 1,
      title: "Ordonnance Diabète",
      doctor: "Dr. Martin Dubois",
      date: "2025-01-15",
      expiryDate: "2025-07-15",
      medications: ["Metformine 850mg", "Insuline Lantus"],
      status: "active"
    },
    {
      id: 2,
      title: "Ordonnance Cholestérol",
      doctor: "Dr. Sophie Laurent",
      date: "2024-11-20",
      expiryDate: "2025-05-20",
      medications: ["Atorvastatine 20mg"],
      status: "active"
    },
    {
      id: 3,
      title: "Ordonnance Sommeil",
      doctor: "Dr. Martin Dubois",
      date: "2024-08-10",
      expiryDate: "2025-02-10",
      medications: ["Zolpidem 10mg"],
      status: "expiring"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "expiring":
        return <Badge variant="warning">Expire bientôt</Badge>;
      case "expired":
        return <Badge variant="danger">Expirée</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Ordonnances</h1>
              <p className="text-muted-foreground">Vos prescriptions médicales</p>
            </div>
            <Button onClick={() => navigate("/prescriptions/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Liste des ordonnances */}
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{prescription.title}</h3>
                    <p className="text-sm text-muted-foreground">{prescription.doctor}</p>
                  </div>
                </div>
                {getStatusBadge(prescription.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Date de prescription</p>
                  <p className="font-medium">{new Date(prescription.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validité</p>
                  <p className="font-medium">{new Date(prescription.expiryDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Médicaments prescrits</p>
                <div className="flex flex-wrap gap-2">
                  {prescription.medications.map((med, idx) => (
                    <Badge key={idx} variant="muted">{med}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  Voir
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}