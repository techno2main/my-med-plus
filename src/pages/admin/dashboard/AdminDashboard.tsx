import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldAlert, Info } from "lucide-react";
import { useAdminAccess } from "./hooks/useAdminAccess";
import { QuickAccessCard } from "./components/QuickAccessCard";
import { adminRoutes } from "./constants";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, roles, loading } = useAdminAccess();

  if (loading) {
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

        {/* Bannière d'information */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Zone réservée aux administrateurs
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Cette section contient des outils de diagnostic et de gestion avancés. 
                Utilisez ces fonctionnalités avec précaution. Survolez les icônes 
                <Info className="h-3 w-3 inline mx-1" /> pour obtenir plus d'informations.
              </p>
            </div>
          </div>
        </Card>

        {/* Section Diagnostics */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Diagnostics</h3>
          <QuickAccessCard
            route={adminRoutes[0]}
            onClick={() => navigate(adminRoutes[0].path)}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
