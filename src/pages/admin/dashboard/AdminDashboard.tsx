import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
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

        {/* Section Navigation */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Navigation</h3>
          <QuickAccessCard
            route={adminRoutes[0]}
            onClick={() => navigate(adminRoutes[0].path)}
          />
        </div>

        {/* Section Diagnostics */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Diagnostics</h3>
          <QuickAccessCard
            route={adminRoutes[1]}
            onClick={() => navigate(adminRoutes[1].path)}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
