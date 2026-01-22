import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useNavigate } from "react-router-dom";
import { Bell, Shield, Smartphone, CalendarSync, Clock, Navigation, ArrowUpDown, Bug, RotateCcw, User } from "lucide-react";
import { NavigationCard } from "./components/NavigationCard";
import { Button } from "@/components/ui/button";
import { useSettingsSectionOrder } from "@/hooks/useSettingsSectionOrder";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function Settings() {
  const navigate = useNavigate();
  const { sections, loading } = useSettingsSectionOrder();
  const { resetOnboarding } = useOnboarding();

  const handleReplayOnboarding = () => {
    resetOnboarding();
    navigate("/onboarding");
  };

  // Mapping des sections vers leurs composants
  const sectionComponents: Record<string, JSX.Element> = {
    personnalisation: (
      <div className="space-y-3" key="personnalisation">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Personnalisation</h3>
        <NavigationCard
          icon={Navigation}
          title="Personnalisation"
          description="Apparence et menu de navigation"
          onClick={() => navigate("/settings/personnalisation")}
        />
      </div>
    ),
    profil: (
      <div className="space-y-3" key="profil">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Profil utilisateur</h3>
        <NavigationCard
          icon={User}
          title="Mon profil"
          description="Gérer mon profil, réseau, santé et stocks"
          onClick={() => navigate("/profile")}
        />
      </div>
    ),
    reglages: (
      <div className="space-y-3" key="reglages">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Réglages</h3>
        <NavigationCard
          icon={Bell}
          title="Réglages"
          description="Notifications, synchronisation et sécurité"
          onClick={() => navigate("/settings/reglages")}
        />
      </div>
    ),
    rattrapage: (
      <div className="space-y-3" key="rattrapage">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Rattrapage</h3>
        <NavigationCard
          icon={Clock}
          title="Mise à jour des prises"
          description="Gérer les prises non traitées"
          onClick={() => navigate("/rattrapage")}
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
        <NavigationCard
          icon={RotateCcw}
          title="Présentation de l'application"
          description="Revoir l'onboarding"
          onClick={handleReplayOnboarding}
        />
      </div>
    ),
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
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
        </div>

        <div className="mt-4 space-y-6">

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
      </div>
    </AppLayout>
  );
}
