import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Fingerprint, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { NativeBiometric } from "capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppLockScreenProps {
  onUnlock: () => void;
  biometricEnabled: boolean;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

export function AppLockScreen({ onUnlock, biometricEnabled }: AppLockScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  // Password attempt tracking
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockEndTime, setLockEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

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

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut || !lockEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((lockEndTime - now) / 1000);
      
      if (remaining <= 0) {
        setIsLockedOut(false);
        setLockEndTime(null);
        setRemainingSeconds(0);
        setFailedAttempts(0);
        clearInterval(interval);
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut, lockEndTime]);

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
      
      // Reset attempts on successful unlock
      setFailedAttempts(0);
      setIsLockedOut(false);
      setLockEndTime(null);
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

    if (isLockedOut) {
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Erreur d'authentification");
        setIsLoading(false);
        return;
      }

      // Pour les utilisateurs Google, on ne peut pas vérifier le mot de passe
      if (isGoogleUser) {
        toast.error("Utilisez la biométrie ou reconnectez-vous via Google");
        setIsLoading(false);
        return;
      }

      // Sauvegarder le token actuel avant la vérification
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      // Vérifier le mot de passe en tentant une connexion
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (error) {
        // Restaurer la session précédente si elle existe
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token
          });
        }
        
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setPassword("");
        
        if (newAttempts >= MAX_ATTEMPTS) {
          // Activate lockout
          const endTime = Date.now() + LOCKOUT_DURATION_SECONDS * 1000;
          setIsLockedOut(true);
          setLockEndTime(endTime);
          setRemainingSeconds(LOCKOUT_DURATION_SECONDS);
          toast.error("Trop de tentatives. Réessayez dans 30 secondes.");
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          toast.error(`Mot de passe incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
        }
        
        setIsLoading(false);
        return;
      }

      // Mot de passe correct - Reset attempts on successful unlock
      setFailedAttempts(0);
      setIsLockedOut(false);
      setLockEndTime(null);
      toast.success("Déverrouillé");
      onUnlock();
    } catch (error) {
      console.error("Erreur vérification:", error);
      toast.error("Erreur lors de la vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const remainingAttemptsText = MAX_ATTEMPTS - failedAttempts;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">MyHealth+</h1>
          <p className="text-sm text-muted-foreground">
            Veuillez vous authentifier pour continuer
          </p>
        </div>

        {biometricAvailable && biometricEnabled && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={attemptBiometricUnlock}
          >
            <Fingerprint className="h-5 w-5" />
            Utiliser la biométrie
          </Button>
        )}

        {/* Lockout warning */}
        {isLockedOut && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Trop de tentatives</p>
              <p className="text-muted-foreground">
                Réessayez dans {remainingSeconds} seconde{remainingSeconds > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Failed attempts warning (before lockout) */}
        {!isLockedOut && failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {remainingAttemptsText} tentative{remainingAttemptsText > 1 ? 's' : ''} restante{remainingAttemptsText > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLockedOut && handlePasswordUnlock()}
              disabled={isLockedOut}
              className={isLockedOut ? "opacity-50" : ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLockedOut}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          <Button
            className="w-full"
            onClick={handlePasswordUnlock}
            disabled={isLoading || isLockedOut}
          >
            {isLoading ? "Vérification..." : isLockedOut ? `Bloqué (${remainingSeconds}s)` : "Déverrouiller"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
