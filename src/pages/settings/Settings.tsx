import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useNavigate } from "react-router-dom";
import { Bell, Shield, Smartphone, Database, CalendarSync, Clock } from "lucide-react";
import { ThemeCard } from "./components/ThemeCard";
import { NavigationCard } from "./components/NavigationCard";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Paramètres"
          subtitle="Réglages généraux"
        />

        {/* Section Thème de l'application */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Thème de l'application</h3>
          <ThemeCard />
        </div>

        {/* Section Notifications */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Notifications</h3>
          <NavigationCard
            icon={Bell}
            title="Notifications"
            description="Configurer les rappels"
            onClick={() => navigate("/notifications")}
          />
        </div>

        {/* Section Référentiels */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Référentiels</h3>
          <NavigationCard
            icon={Database}
            title="Référentiels"
            description="Gérer les données de référence"
            onClick={() => navigate("/referentials")}
          />
        </div>

        {/* Section Calendrier */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Calendrier</h3>
          <NavigationCard
            icon={CalendarSync}
            title="Synchronisation"
            description="Synchroniser avec le calendrier natif"
            onClick={() => navigate("/calendar-sync")}
          />
        </div>

        {/* Section Rattrapage */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Rattrapage</h3>
          <NavigationCard
            icon={Clock}
            title="Rattrapage des prises"
            description="Gérer les prises manquées"
            onClick={() => navigate("/rattrapage")}
          />
        </div>

        {/* Section Sécurité */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Sécurité</h3>
          <NavigationCard
            icon={Shield}
            title="Confidentialité et sécurité"
            description="Protection des données"
            onClick={() => navigate("/privacy")}
          />
        </div>

        {/* Section À propos */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">À propos</h3>
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
