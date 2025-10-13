import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Moon, 
  Shield, 
  User, 
  Smartphone,
  ChevronRight,
  LogOut,
  FileText,
  ClipboardList,
  Database,
  Navigation
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Paramètres"
          subtitle="Gérez vos préférences et votre compte"
        />

        {/* Navigation rapide */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Navigation</h3>

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

          <Card className="p-4" onClick={() => navigate("/prescriptions")}>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Ordonnances</h3>
                  <p className="text-sm text-muted-foreground">Prescriptions médicales</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4" onClick={() => navigate("/history")}>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Historique</h3>
                  <p className="text-sm text-muted-foreground">Suivi des prises</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Profil */}
        <Card className="p-4" onClick={() => navigate("/profile")}>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Profil utilisateur</h3>
                <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-4" onClick={() => navigate("/notifications")}>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">Configurez vos rappels</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        {/* Apparence */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Moon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Apparence</h3>
              <p className="text-sm text-muted-foreground">Personnalisez l'interface</p>
            </div>
          </div>

          <div className="space-y-4 pl-15">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex-1">
                <p className="font-medium">Mode sombre</p>
                <p className="text-sm text-muted-foreground">Thème sombre activé</p>
              </Label>
              <Switch id="dark-mode" defaultChecked />
            </div>
          </div>
        </Card>

        {/* Confidentialité */}
        <Card className="p-4" onClick={() => navigate("/privacy")}>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Confidentialité et sécurité</h3>
                <p className="text-sm text-muted-foreground">Protégez vos données</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        {/* À propos */}
        <Card className="p-4" onClick={() => navigate("/about")}>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">À propos de l'application</h3>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        {/* Déconnexion */}
        <Button 
          variant="outline" 
          className="w-full border-danger text-danger hover:bg-danger hover:text-white"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </AppLayout>
  );
}