import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { SecurityCard } from "./components/SecurityCard";
import { DataManagementCard } from "./components/DataManagementCard";
import { PasswordChangeDialog } from "./components/PasswordChangeDialog";
import { BiometricPasswordDialog } from "./components/BiometricPasswordDialog";
import { ConfirmationAlerts } from "./components/ConfirmationAlerts";
import { usePrivacySettings } from "./hooks/usePrivacySettings";
import { usePrivacyDialogs } from "./hooks/usePrivacyDialogs";

export default function Privacy() {
  const {
    authProvider,
    biometricEnabled,
    twoFactorEnabled,
    loading,
    handlePasswordChange,
    handleBiometricToggle,
    handleBiometricPasswordConfirm,
    handleTwoFactorToggle,
    handleExportData,
    handleDeleteAccount,
  } = usePrivacySettings();

  const {
    showPasswordDialog,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    openPasswordDialog,
    closePasswordDialog,
    showBiometricPasswordDialog,
    biometricPassword,
    setBiometricPassword,
    openBiometricPasswordDialog,
    closeBiometricPasswordDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showExportDialog,
    setShowExportDialog,
    pendingBiometricChange,
    setPendingBiometricChange,
    pendingTwoFactorChange,
    setPendingTwoFactorChange,
  } = usePrivacyDialogs();

  const onPasswordSubmit = async () => {
    const success = await handlePasswordChange(newPassword, confirmPassword);
    if (success) closePasswordDialog();
  };

  const onBiometricToggle = () => {
    setPendingBiometricChange(true);
  };

  const onBiometricConfirm = async () => {
    const result = await handleBiometricToggle(!biometricEnabled);
    if (result.needsPassword) {
      openBiometricPasswordDialog();
    } else {
      setPendingBiometricChange(false);
    }
  };

  const onBiometricPasswordSubmit = async () => {
    const success = await handleBiometricPasswordConfirm(biometricPassword);
    if (success) closeBiometricPasswordDialog();
  };

  const onTwoFactorToggle = () => {
    setPendingTwoFactorChange(true);
  };

  const onTwoFactorConfirm = async () => {
    await handleTwoFactorToggle(!twoFactorEnabled);
    setPendingTwoFactorChange(false);
  };

  const onExportConfirm = async () => {
    await handleExportData();
    setShowExportDialog(false);
  };

  const onDeleteConfirm = async () => {
    await handleDeleteAccount();
    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p>Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Sécurité"
          subtitle="Protection des données personnelles"
          backTo="/settings"
        />

        <SecurityCard
          authProvider={authProvider}
          biometricEnabled={biometricEnabled}
          twoFactorEnabled={twoFactorEnabled}
          onPasswordChange={openPasswordDialog}
          onBiometricToggle={onBiometricToggle}
          onTwoFactorToggle={onTwoFactorToggle}
        />

        <DataManagementCard
          onExportData={() => setShowExportDialog(true)}
          onDeleteAccount={() => setShowDeleteDialog(true)}
        />

        <PasswordChangeDialog
          open={showPasswordDialog}
          onOpenChange={closePasswordDialog}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={onPasswordSubmit}
        />

        <BiometricPasswordDialog
          open={showBiometricPasswordDialog}
          onOpenChange={closeBiometricPasswordDialog}
          password={biometricPassword}
          onPasswordChange={setBiometricPassword}
          onSubmit={onBiometricPasswordSubmit}
        />

        <ConfirmationAlerts
          biometricOpen={pendingBiometricChange}
          biometricEnabled={biometricEnabled}
          onBiometricOpenChange={setPendingBiometricChange}
          onBiometricConfirm={onBiometricConfirm}
          twoFactorOpen={pendingTwoFactorChange}
          twoFactorEnabled={twoFactorEnabled}
          onTwoFactorOpenChange={setPendingTwoFactorChange}
          onTwoFactorConfirm={onTwoFactorConfirm}
          exportOpen={showExportDialog}
          onExportOpenChange={setShowExportDialog}
          onExportConfirm={onExportConfirm}
          deleteOpen={showDeleteDialog}
          onDeleteOpenChange={setShowDeleteDialog}
          onDeleteConfirm={onDeleteConfirm}
        />
      </div>
    </AppLayout>
  );
}
