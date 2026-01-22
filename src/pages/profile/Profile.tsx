import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { setFilePickerActive } from "@/hooks/useFilePicker";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfileCompletion } from "@/contexts/ProfileCompletionContext";
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
import { ProfileTabs, ProfileTabType, getTabTitle } from "./components/ProfileTabs";
import { HealthTabs } from "./components/HealthTabs";
import { HealthProfessionalsContent } from "@/pages/health-professionals/HealthProfessionalsContent";
import { AllergiesContent } from "@/pages/allergies/AllergiesContent";
import { PathologiesContent } from "@/pages/pathologies/PathologiesContent";
import { StockContent } from "@/pages/stocks/StockContent";
import type { ProfileFieldName } from "@/contexts/ProfileCompletionContext";

export default function Profile() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refetch: refetchProfileCompletion } = useProfileCompletion();
  
  // Gestion des onglets
  const [activeTab, setActiveTab] = useState<ProfileTabType>("profil");
  
  // Stocker le champ à focus avant de nettoyer les query params
  const [fieldToFocus, setFieldToFocus] = useState<ProfileFieldName | null>(null);
  
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

  // Lire les query params pour auto-edit, focus et onglet
  const shouldEdit = searchParams.get('edit') === 'true';
  const focusFieldFromParams = searchParams.get('focus') as ProfileFieldName | null;
  const tabParam = searchParams.get('tab') as ProfileTabType | null;

  // Gérer l'onglet depuis les query params
  useEffect(() => {
    if (tabParam && ['profil', 'reseau', 'sante', 'stocks'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Auto-ouvrir le mode édition si demandé via query params
  useEffect(() => {
    if (shouldEdit && !loading) {
      setIsEditing(true);
      // Stocker le champ à focus avant de nettoyer les params
      if (focusFieldFromParams) {
        setFieldToFocus(focusFieldFromParams);
      }
      // Nettoyer les query params après avoir lu
      setSearchParams({}, { replace: true });
    }
  }, [shouldEdit, loading, focusFieldFromParams, setIsEditing, setSearchParams]);

  // Réinitialiser le champ à focus quand on quitte le mode édition
  useEffect(() => {
    if (!isEditing) {
      setFieldToFocus(null);
    }
  }, [isEditing]);

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

  const currentTabInfo = getTabTitle(activeTab);

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 pb-24">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <PageHeader 
            title={currentTabInfo.title}
            subtitle={currentTabInfo.subtitle}
            backTo="/"
          />
        </div>

        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {{
            profil: (
              <>
                <Card className="p-4 sm:p-6">
                  <ProfileHeader
                    firstName={firstName}
                    lastName={lastName}
                    email={user?.email || ""}
                    avatarUrl={avatarUrl}
                    isAdmin={isAdmin}
                    isEditing={isEditing}
                    onEditClick={() => setIsEditing(true)}
                    onAvatarClick={() => {
                      setFilePickerActive(true);
                      fileInputRef.current?.click();
                    }}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      setFilePickerActive(false);
                      handleAvatarUpload(e);
                    }}
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
                      focusField={fieldToFocus}
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
              </>
            ),
            reseau: <HealthProfessionalsContent />,
            sante: (
              <HealthTabs
                allergiesContent={<AllergiesContent />}
                pathologiesContent={<PathologiesContent />}
              />
            ),
            stocks: <StockContent />
          }}
        </ProfileTabs>
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
