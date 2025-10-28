import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useNavigate } from "react-router-dom";
import { Bell, Shield, Smartphone } from "lucide-react";
import { ThemeCard } from "./components/ThemeCard";
import { NavigationCard } from "./components/NavigationCard";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Paramètres"
          subtitle="Gérer les préférences"
        />

        {/* Section Réglages */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Réglages</h3>

          <ThemeCard />

          <NavigationCard
            icon={Bell}
            title="Notifications"
            description="Configurer les rappels"
            onClick={() => navigate("/notifications")}
          />

          <NavigationCard
            icon={Shield}
            title="Confidentialité et sécurité"
            description="Protection des données"
            onClick={() => navigate("/privacy")}
          />

          <NavigationCard
            icon={Smartphone}
            title="À propos de l'application"
            description="Version 1.0.0"
            onClick={() => navigate("/about")}
          />
        </div>
      </div>
    </AppLayout>
  );
}
