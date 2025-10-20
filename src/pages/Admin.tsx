import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigation, Database, ChevronRight, ShieldAlert, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-danger" />
            <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Administration"
          subtitle="Gérer les paramètres avancés"
        />

        {/* Section Navigation */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Navigation</h3>
          
          <Card className="p-4" onClick={() => navigate("/settings/navigation")}>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Menu de navigation</h3>
                  <p className="text-sm text-muted-foreground">Gérer la barre de navigation</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-4" onClick={() => navigate("/referentials")}>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Référentiels</h3>
                  <p className="text-sm text-muted-foreground">Gérer les données de référence</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4" onClick={() => navigate("/rattrapage")}>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Rattrapage des prises</h3>
                  <p className="text-sm text-muted-foreground">Gérer les prises manquées</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
