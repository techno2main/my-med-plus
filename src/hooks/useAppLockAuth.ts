import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "capacitor-native-biometric";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

export function useAppLockAuth(onUnlock: () => void, biometricEnabled: boolean) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockEndTime, setLockEndTime] = useState<number | null>(null);

  useEffect(() => {
    checkBiometricAvailability();
    checkAuthProvider();
  }, []);

  useEffect(() => {
    // Tenter automatiquement la biométrie si disponible et activée
    if (biometricAvailable && biometricEnabled && !attemptingBiometric) {
      setAttemptingBiometric(true);
      attemptBiometricUnlock();
    }
  }, [biometricAvailable, biometricEnabled]);

  const checkAuthProvider = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const provider = user.app_metadata?.provider;
        setIsGoogleUser(provider === 'google');
      }
    } catch {
      console.error("Erreur vérification provider");
    }
  };

  const checkBiometricAvailability = async () => {
    if (!Capacitor.isNativePlatform()) {
      setBiometricAvailable(false);
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      setBiometricAvailable(result.isAvailable);
    } catch {
      setBiometricAvailable(false);
    }
  };

  const attemptBiometricUnlock = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await NativeBiometric.verifyIdentity({
        reason: "Déverrouiller MyHealth+",
        title: "Authentification",
        subtitle: "Utilisez votre empreinte digitale ou Face ID",
        description: "Pour accéder à l'application"
      });
      
      resetAttempts();
      onUnlock();
    } catch (error) {
      console.log("Biometric verification cancelled or failed");
    }
  };

  const handlePasswordUnlock = async () => {
    if (!password.trim()) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }

    if (isLockedOut) return;

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Erreur d'authentification");
        setIsLoading(false);
        return;
      }

      if (isGoogleUser) {
        toast.error("Utilisez la biométrie ou reconnectez-vous via Google");
        setIsLoading(false);
        return;
      }

      // Sauvegarder le token actuel avant la vérification
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      // Vérifier le mot de passe
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (error) {
        // Restaurer la session précédente
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token
          });
        }
        
        handleFailedAttempt();
      } else {
        handleSuccessfulUnlock();
      }
    } catch (error) {
      console.error("Erreur vérification:", error);
      toast.error("Erreur lors de la vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedAttempt = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    setPassword("");
    
    if (newAttempts >= MAX_ATTEMPTS) {
      activateLockout();
    } else {
      const remaining = MAX_ATTEMPTS - newAttempts;
      toast.error(`Mot de passe incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
    }
  };

  const activateLockout = () => {
    const endTime = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
    setIsLockedOut(true);
    setLockEndTime(endTime);
    toast.error("Trop de tentatives. Réessayez dans 30 secondes.");
  };

  const handleSuccessfulUnlock = () => {
    resetAttempts();
    toast.success("Déverrouillé");
    onUnlock();
  };

  const resetAttempts = () => {
    setFailedAttempts(0);
    setIsLockedOut(false);
    setLockEndTime(null);
  };

  return {
    // State
    password,
    setPassword,
    isLoading,
    biometricAvailable,
    isGoogleUser,
    failedAttempts,
    isLockedOut,
    lockEndTime,
    // Actions
    attemptBiometricUnlock,
    handlePasswordUnlock,
    resetAttempts
  };
}
