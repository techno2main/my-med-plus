import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Calendar, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <AppLayout showBottomNav={false}>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Profil utilisateur</h1>
            <p className="text-muted-foreground">Gérez vos informations personnelles</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="p-6 rounded-full bg-primary/10">
              <User className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="fullName" 
                  placeholder="Votre nom complet" 
                  className="pl-10"
                  defaultValue="Jean Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="votre@email.com" 
                  className="pl-10"
                  defaultValue="jean.dupont@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date de naissance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="dateOfBirth" 
                  type="date" 
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <Button className="w-full mt-6">
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les modifications
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Informations médicales</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Groupe sanguin</Label>
              <Input id="bloodType" placeholder="A+" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Taille (cm)</Label>
              <Input id="height" type="number" placeholder="170" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input id="weight" type="number" placeholder="70" />
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
