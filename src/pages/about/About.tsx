import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Globe, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="À propos"
          subtitle="Informations sur l'application"
          backTo="/settings"
        />

        {/* Logo et version */}
        <Card className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-6 rounded-full bg-primary/10">
              <Heart className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">MyHealth+</h2>
          <p className="text-muted-foreground mb-1">Votre assistant santé personnel</p>
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
        </Card>

        {/* Description */}
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notre mission</h3>
          <p className="text-muted-foreground leading-relaxed">
            MyHealth+ est une application conçue pour vous aider à gérer vos traitements médicaux en toute simplicité. 
            Suivez vos prises, gérez vos stocks et consultez vos ordonnances en un seul endroit.
          </p>
        </Card>

        {/* Fonctionnalités */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Fonctionnalités principales</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-primary/10 mt-1">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Suivi des traitements</p>
                <p className="text-sm text-muted-foreground">Rappels personnalisés pour ne jamais oublier</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-primary/10 mt-1">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Gestion des stocks</p>
                <p className="text-sm text-muted-foreground">Alertes de réapprovisionnement</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-primary/10 mt-1">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Ordonnances numériques</p>
                <p className="text-sm text-muted-foreground">Stockage sécurisé de vos prescriptions</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-1 rounded-full bg-primary/10 mt-1">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Historique détaillé</p>
                <p className="text-sm text-muted-foreground">Suivi de votre observance thérapeutique</p>
              </div>
            </li>
          </ul>
        </Card>

        {/* Contact */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Contact</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="mailto:support@techno2main.fr?bcc=techno2main@gmail.com&subject=Contact%20from%20MyHealth%2B%20App">
                <Mail className="mr-2 h-4 w-4" />
                E-mail
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://myhealthplus.web-tad.app" target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                Application MyHealth+ 
              </a>
            </Button>
          </div>
        </Card>

        {/* Crédits */}
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            MyHealth+
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2025 • TAD • Tous droits réservés.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
