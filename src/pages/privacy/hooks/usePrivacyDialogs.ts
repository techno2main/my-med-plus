import { useState } from "react";

export const usePrivacyDialogs = () => {
  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Biometric password prompt
  const [showBiometricPasswordDialog, setShowBiometricPasswordDialog] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState("");
  
  // Confirmation dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [pendingBiometricChange, setPendingBiometricChange] = useState(false);
  const [pendingTwoFactorChange, setPendingTwoFactorChange] = useState(false);

  const openPasswordDialog = () => setShowPasswordDialog(true);
  
  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const openBiometricPasswordDialog = () => {
    setPendingBiometricChange(false);
    setTimeout(() => {
      setShowBiometricPasswordDialog(true);
    }, 100);
  };

  const closeBiometricPasswordDialog = () => {
    setShowBiometricPasswordDialog(false);
    setBiometricPassword("");
  };

  return {
    // Password change
    showPasswordDialog,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    openPasswordDialog,
    closePasswordDialog,
    
    // Biometric password
    showBiometricPasswordDialog,
    biometricPassword,
    setBiometricPassword,
    openBiometricPasswordDialog,
    closeBiometricPasswordDialog,
    
    // Confirmations
    showDeleteDialog,
    setShowDeleteDialog,
    showExportDialog,
    setShowExportDialog,
    pendingBiometricChange,
    setPendingBiometricChange,
    pendingTwoFactorChange,
    setPendingTwoFactorChange,
  };
};
