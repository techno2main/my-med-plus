import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useProfileData } from "./hooks/useProfileData";
import { useProfileWizard } from "./hooks/useProfileWizard";
import { calculateAge, calculateBMI, getBMIColor } from "./utils/profileUtils";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileFormEdit } from "./components/ProfileFormEdit";
import { ProfileFormView } from "./components/ProfileFormView";
import { ProfileActions } from "./components/ProfileActions";
import { ExportDataCard } from "./components/ExportDataCard";
import { LogoutButton } from "./components/LogoutButton";
import { ProfileWizardDialog } from "./components/ProfileWizard";
import type { ProfileFieldName } from "@/hooks/useProfileCompletion";

export default function Profile() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refetch: refetchProfileCompletion } = useProfileCompletion();
  
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

  const { showWizard, closeWizard, completeWizard, skipWizard } = useProfileWizard();

  // Lire les query params pour auto-edit et focus
  const shouldEdit = searchParams.get('edit') === 'true';
  const focusField = searchParams.get('focus') as ProfileFieldName | null;

  // Auto-ouvrir le mode édition si demandé via query params
  useEffect(() => {
    if (shouldEdit && !loading) {
      setIsEditing(true);
      // Nettoyer les query params après avoir lu
      setSearchParams({}, { replace: true });
    }
  }, [shouldEdit, loading, setIsEditing, setSearchParams]);

  const age = calculateAge(dateOfBirth);
  const bmi = calculateBMI(height, weight);

  // Wrapper pour sauvegarder et rafraîchir le badge de complétion
  const handleSaveWithRefresh = async () => {
    const success = await handleSave();
    if (success) {
      // Rafraîchir le statut de complétion pour mettre à jour le badge dans le header
      await refetchProfileCompletion();
    }
  };

  const handleWizardComplete = async () => {
    const success = await handleSave();
    if (success) {
      await refetchProfileCompletion();
    }
    completeWizard();
  };

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
              focusField={focusField}
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
            onSave={handleSaveWithRefresh}
          />
        </Card>

        <ExportDataCard />

        <LogoutButton onLogout={handleLogout} />
      </div>

      {/* Wizard didacticiel pour compléter le profil */}
      <ProfileWizardDialog
        open={showWizard}
        onOpenChange={closeWizard}
        firstName={firstName}
        lastName={lastName}
        dateOfBirth={dateOfBirth}
        bloodType={bloodType}
        height={height}
        weight={weight}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onDateOfBirthChange={setDateOfBirth}
        onBloodTypeChange={setBloodType}
        onHeightChange={setHeight}
        onWeightChange={setWeight}
        onComplete={handleWizardComplete}
        onSkip={skipWizard}
      />
    </AppLayout>
  );
}
