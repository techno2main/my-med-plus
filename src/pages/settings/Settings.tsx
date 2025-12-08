import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useNavigate } from "react-router-dom";
import { Bell, Shield, Smartphone, Database, CalendarSync, Clock, Navigation, ArrowUpDown, Bug, Package } from "lucide-react";
import { ThemeCard } from "./components/ThemeCard";
import { NavigationCard } from "./components/NavigationCard";
import { Button } from "@/components/ui/button";
import { useSettingsSectionOrder } from "@/hooks/useSettingsSectionOrder";

export default function Settings() {
  const navigate = useNavigate();
  const { sections, loading } = useSettingsSectionOrder();

  // Mapping des sections vers leurs composants
  const sectionComponents: Record<string, JSX.Element> = {
    theme: (
      <div className="space-y-3" key="theme">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Thème de l'application</h3>
        <ThemeCard />
      </div>
    ),
    navigation: (
      <div className="space-y-3" key="navigation">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Personnalisation</h3>
        <NavigationCard
          icon={Navigation}
          title="Menu de navigation"
          description="Personnaliser l'ordre et la visibilité des éléments"
          onClick={() => navigate("/settings/navigation")}
        />
      </div>
    ),
    notifications: (
      <div className="space-y-3" key="notifications">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Notifications</h3>
        <NavigationCard
          icon={Bell}
          title="Notifications"
          description="Configurer les rappels"
          onClick={() => navigate("/notifications")}
        />
      </div>
    ),
    referentials: (
      <div className="space-y-3" key="referentials">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Référentiels</h3>
        <NavigationCard
          icon={Database}
          title="Référentiels"
          description="Gérer les données de référence"
          onClick={() => navigate("/referentials")}
        />
      </div>
    ),
    stocks: (
      <div className="space-y-3" key="stocks">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Stocks</h3>
        <NavigationCard
          icon={Package}
          title="Gestion des stocks"
          description="Gérer les stocks de médicaments"
          onClick={() => navigate("/stocks")}
        />
      </div>
    ),
    calendar: (
      <div className="space-y-3" key="calendar">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Calendrier</h3>
        <NavigationCard
          icon={CalendarSync}
          title="Synchronisation"
          description="Synchroniser avec le calendrier natif"
          onClick={() => navigate("/calendar-sync")}
        />
      </div>
    ),
    rattrapage: (
      <div className="space-y-3" key="rattrapage">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Rattrapage</h3>
        <NavigationCard
          icon={Clock}
          title="Rattrapage des prises"
          description="Gérer les prises manquées"
          onClick={() => navigate("/rattrapage")}
        />
      </div>
    ),
    security: (
      <div className="space-y-3" key="security">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Sécurité</h3>
        <NavigationCard
          icon={Shield}
          title="Confidentialité et sécurité"
          description="Protection des données"
          onClick={() => navigate("/privacy")}
        />
      </div>
    ),
    diagnostics: (
      <div className="space-y-3" key="diagnostics">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Diagnostics</h3>
        <NavigationCard
          icon={Bug}
          title="Diagnostic des notifications"
          description="Diagnostiquer les notifications"
          onClick={() => navigate("/notifications/debug")}
        />
      </div>
    ),
    about: (
      <div className="space-y-3" key="about">
        <h3 className="text-sm font-medium text-muted-foreground px-1">À propos</h3>
        <NavigationCard
          icon={Smartphone}
          title="À propos de l'application"
          description="Version 1.1.0"
          onClick={() => navigate("/about")}
        />
      </div>
    ),
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Paramètres"
            subtitle="Réglages généraux"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/settings/sections-order")}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Réorganiser
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : (
          <>
            {sections
              .filter(section => section.visible)
              .map(section => sectionComponents[section.id])}
          </>
        )}
      </div>
    </AppLayout>
  );
}
