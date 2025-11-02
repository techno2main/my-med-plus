import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfileData } from "./hooks/useProfileData";
import { calculateAge, calculateBMI, getBMIColor } from "./utils/profileUtils";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileFormEdit } from "./components/ProfileFormEdit";
import { ProfileFormView } from "./components/ProfileFormView";
import { ProfileActions } from "./components/ProfileActions";
import { ExportDataCard } from "./components/ExportDataCard";
import { LogoutButton } from "./components/LogoutButton";

export default function Profile() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  
  const {
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
  } = useProfileData();

  const age = calculateAge(dateOfBirth);
  const bmi = calculateBMI(height, weight);

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
          <ProfileHeader
            firstName={firstName}
            lastName={lastName}
            email={user?.email || ""}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
            isEditing={isEditing}
            onEditClick={() => setIsEditing(true)}
            onAvatarClick={() => fileInputRef.current?.click()}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          {isEditing ? (
            <ProfileFormEdit
              firstName={firstName}
              lastName={lastName}
              dateOfBirth={dateOfBirth}
              bloodType={bloodType}
              height={height}
              weight={weight}
              age={age}
              bmi={bmi}
              getBMIColor={getBMIColor}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onDateOfBirthChange={setDateOfBirth}
              onBloodTypeChange={setBloodType}
              onHeightChange={setHeight}
              onWeightChange={setWeight}
            />
          ) : (
            <ProfileFormView
              dateOfBirth={dateOfBirth}
              bloodType={bloodType}
              height={height}
              weight={weight}
              age={age}
              bmi={bmi}
              getBMIColor={getBMIColor}
            />
          )}

          <ProfileActions
            isEditing={isEditing}
            saving={saving}
            onCancel={() => setIsEditing(false)}
            onSave={handleSave}
          />
        </Card>

        <ExportDataCard />

        <LogoutButton onLogout={handleLogout} />
      </div>
    </AppLayout>
  );
}
