import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarWithBadge } from "@/components/ui/avatar-with-badge";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { Badge } from "@/components/ui/badge";
import { Save, Camera, Edit, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { differenceInYears, format } from "date-fns";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      // Format the date properly
      let dateOfBirthString = null;
      if (dateOfBirth) {
        try {
          dateOfBirthString = format(dateOfBirth, "yyyy-MM-dd");
        } catch (e) {
          console.error("Error formatting date:", e);
          toast.error("Format de date invalide");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirthString,
          blood_type: bloodType,
          height: height ? parseInt(height) : null,
          weight: weight ? parseFloat(weight) : null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success("Profil mis à jour avec succès");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error?.message || "Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie");
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const age = calculateAge();
  const bmi = calculateBMI();

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <div className="text-center">Chargement...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6 pb-24">
        <PageHeader 
          title="Profil utilisateur"
          subtitle="Gérer vos informations"
          backTo="/"
        />

        <Card className="p-4 sm:p-6">
          {/* Avatar et nom - en ligne */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative group shrink-0">
              <AvatarWithBadge
                src={avatarUrl || undefined}
                alt="Avatar"
                fallback={
                  <span className="bg-primary/10 text-base sm:text-lg font-medium h-full w-full flex items-center justify-center">
                    {firstName?.[0]}{lastName?.[0]}
                  </span>
                }
                isAdmin={isAdmin}
                className="h-14 w-14 sm:h-16 sm:w-16"
              />
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold truncate">{firstName} {lastName}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="shrink-0">
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
            )}
          </div>

          {isEditing ? (
            <>
              {/* Mode édition */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Prénom" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
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

              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)} disabled={saving}>
                  Annuler
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Mode consultation */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date de naissance</Label>
                    <p className="font-medium mt-1">{dateOfBirth ? format(dateOfBirth, "dd/MM/yyyy") : "-"}</p>
                  </div>
                  <div className="flex items-end justify-start">
                    {age !== null && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {age} ans
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Informations médicales</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Groupe sanguin</Label>
                      <p className="font-medium mt-1">{bloodType || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">IMC</Label>
                      {bmi ? (
                        <p className={`font-medium mt-1 ${getBMIColor(parseFloat(bmi))}`}>
                          {bmi} - {getBMILabel(parseFloat(bmi))}
                        </p>
                      ) : (
                        <p className="text-muted-foreground mt-1">-</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Taille</Label>
                      <p className="font-medium mt-1">{height ? `${height} cm` : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Poids</Label>
                      <p className="font-medium mt-1">{weight ? `${weight} kg` : "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Déconnexion */}
        <Button 
          variant="outline" 
          className="w-full border-danger text-danger hover:bg-danger hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </AppLayout>
  );
}
