import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <AppLayout showBottomNav={false}>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Confidentialité et sécurité</h1>
            <p className="text-muted-foreground">Protégez vos données personnelles</p>
          </div>
        </div>

        {/* Sécurité du compte */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Sécurité du compte</h3>
          </div>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Changer le mot de passe
            </Button>
            <div className="flex items-center justify-between">
              <Label htmlFor="biometric" className="flex-1">
                <p className="font-medium">Authentification biométrique</p>
                <p className="text-sm text-muted-foreground">Face ID / Empreinte digitale</p>
              </Label>
              <Switch id="biometric" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa" className="flex-1">
                <p className="font-medium">Authentification à deux facteurs</p>
                <p className="text-sm text-muted-foreground">Protection supplémentaire</p>
              </Label>
              <Switch id="2fa" />
            </div>
          </div>
        </Card>

        {/* Confidentialité des données */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Confidentialité des données</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics" className="flex-1">
                <p className="font-medium">Partage de données anonymes</p>
                <p className="text-sm text-muted-foreground">Pour améliorer l'application</p>
              </Label>
              <Switch id="analytics" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="medical-share" className="flex-1">
                <p className="font-medium">Partage avec professionnels de santé</p>
                <p className="text-sm text-muted-foreground">Autoriser l'accès à mon historique</p>
              </Label>
              <Switch id="medical-share" />
            </div>
          </div>
        </Card>

        {/* Gestion des données */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Gestion des données</h3>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Télécharger mes données
            </Button>
            <Button variant="outline" className="w-full justify-start text-danger hover:bg-danger hover:text-white border-danger">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer mon compte
            </Button>
          </div>
        </Card>

        {/* Politique de confidentialité */}
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Documents légaux</h3>
          <div className="space-y-2">
            <Button variant="link" className="p-0 h-auto text-primary">
              Politique de confidentialité
            </Button>
            <br />
            <Button variant="link" className="p-0 h-auto text-primary">
              Conditions générales d'utilisation
            </Button>
            <br />
            <Button variant="link" className="p-0 h-auto text-primary">
              Mentions légales
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
