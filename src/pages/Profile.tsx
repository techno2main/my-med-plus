import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Save, Camera, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { differenceInYears } from "date-fns";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [bloodType, setBloodType] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || "");
        setDateOfBirth(data.date_of_birth ? new Date(data.date_of_birth) : undefined);
        setBloodType(data.blood_type || "");
        setHeight(data.height?.toString() || "");
        setWeight(data.weight?.toString() || "");
        setAvatarUrl(data.avatar_url || user?.user_metadata?.avatar_url || "");
      } else if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      // Add timestamp to force refresh
      const avatarUrlWithTimestamp = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(avatarUrlWithTimestamp);
      
      // Save to database immediately
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;
      
      toast.success("Photo de profil mise à jour");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erreur lors de l'upload de la photo");
    }
  };

  const calculateAge = () => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), dateOfBirth);
  };

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) return null;
    const bmi = w / Math.pow(h / 100, 2);
    return bmi.toFixed(1);
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return "text-blue-500";
    if (bmi < 25) return "text-green-500";
    if (bmi < 30) return "text-orange-500";
    return "text-red-500";
  };

  const getBMILabel = (bmi: number) => {
    if (bmi < 18.5) return "Insuffisance pondérale";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Surpoids";
    return "Obésité";
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone,
          date_of_birth: dateOfBirth?.toISOString().split("T")[0],
          blood_type: bloodType,
          height: height ? parseInt(height) : null,
          weight: weight ? parseFloat(weight) : null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
    }
  };

  const age = calculateAge();
  const bmi = calculateBMI();

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">Chargement...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Profil utilisateur"
          subtitle="Gérez vos informations personnelles"
          backTo="/settings"
        />

        <Card className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt="Avatar" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="firstName" 
                    placeholder="Prénom" 
                    className="pl-10"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input 
                  id="lastName" 
                  placeholder="Nom" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                  className="pl-10 bg-muted"
                  value={user?.email || ""}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Date de naissance</Label>
                {age !== null && (
                  <Badge variant="secondary" className="text-xs">
                    {age} ans
                  </Badge>
                )}
              </div>
              <ModernDatePicker
                value={dateOfBirth}
                onChange={setDateOfBirth}
                placeholder="Sélectionner la date de naissance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Informations médicales</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Groupe sanguin</Label>
                  <Input 
                    id="bloodType" 
                    placeholder="A+" 
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IMC</Label>
                  {bmi ? (
                    <div className={`flex items-center h-10 px-3 rounded-md border ${getBMIColor(parseFloat(bmi))} text-sm font-medium`}>
                      {bmi}
                    </div>
                  ) : (
                    <div className="h-10 px-3 rounded-md border bg-muted flex items-center text-sm text-muted-foreground">
                      En attente
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Taille (cm)</Label>
                  <Input 
                    id="height" 
                    type="number" 
                    placeholder="170" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input 
                    id="weight" 
                    type="number" 
                    step="0.1"
                    placeholder="70" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full mt-6" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
