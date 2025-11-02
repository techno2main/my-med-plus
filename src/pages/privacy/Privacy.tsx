import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { SecurityCard } from "./components/SecurityCard";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { ForgotPasswordDialog } from "./components/ForgotPasswordDialog";
import { BiometricPasswordDialog } from "./components/BiometricPasswordDialog";
import { ConfirmationAlerts } from "./components/ConfirmationAlerts";
import { DeleteAccountDialog } from "./components/DeleteAccountDialog";
import { usePrivacySettings } from "./hooks/usePrivacySettings";
import { usePrivacyDialogs } from "./hooks/usePrivacyDialogs";

export default function Privacy() {
  const {
    authProvider,
    biometricEnabled,
    twoFactorEnabled,
    loading,
    handlePasswordChange,
    handleForgotPassword,
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

  // States pour les nouveaux dialogs
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  const onPasswordSubmit = async () => {
    const success = await handlePasswordChange(newPassword, confirmPassword);
    if (success) closePasswordDialog();
  };

  const onChangePasswordConfirm = async (currentPassword: string, newPassword: string) => {
    setIsChangingPassword(true);
    const success = await handlePasswordChange(currentPassword, newPassword);
    setIsChangingPassword(false);
    return success;
  };

  const onForgotPasswordConfirm = async (email: string) => {
    setIsSendingResetEmail(true);
    const success = await handleForgotPassword(email);
    setIsSendingResetEmail(false);
    return success;
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

  const onDeleteConfirm = async (password: string) => {
    const success = await handleDeleteAccount(password);
    if (success) {
      setShowDeleteDialog(false);
    }
    return success;
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
          onPasswordChange={() => setShowChangePasswordDialog(true)}
          onBiometricToggle={onBiometricToggle}
          onTwoFactorToggle={onTwoFactorToggle}
          onDeleteAccount={() => setShowDeleteDialog(true)}
        />

        <ChangePasswordDialog
          open={showChangePasswordDialog}
          onOpenChange={setShowChangePasswordDialog}
          onConfirm={onChangePasswordConfirm}
          onForgotPassword={() => setShowForgotPasswordDialog(true)}
          isChanging={isChangingPassword}
        />

        <ForgotPasswordDialog
          open={showForgotPasswordDialog}
          onOpenChange={setShowForgotPasswordDialog}
          onConfirm={onForgotPasswordConfirm}
          biometricEnabled={biometricEnabled}
          isSending={isSendingResetEmail}
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
        />

        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirmDelete={onDeleteConfirm}
          authProvider={authProvider}
          biometricEnabled={biometricEnabled}
        />
      </div>
    </AppLayout>
  );
}
