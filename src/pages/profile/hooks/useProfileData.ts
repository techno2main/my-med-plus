import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export const useProfileData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        setAvatarUrl(data.avatar_url || "");
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
      
      const avatarUrlWithTimestamp = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(avatarUrlWithTimestamp);
      
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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
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

  return {
    loading,
    saving,
    isEditing,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    bloodType,
    height,
    weight,
    avatarUrl,
    fileInputRef,
    setIsEditing,
    setFirstName,
    setLastName,
    setDateOfBirth,
    setBloodType,
    setHeight,
    setWeight,
    handleAvatarUpload,
    handleSave,
    handleLogout,
  };
};
