import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Fingerprint } from "lucide-react";
import { useAppLockAuth } from "@/hooks/useAppLockAuth";
import { useLockoutTimer } from "@/hooks/useLockoutTimer";
import { AppLockForm } from "./AppLockForm";

interface AppLockScreenProps {
  onUnlock: () => void;
  biometricEnabled: boolean;
}

const MAX_ATTEMPTS = 3;

export function AppLockScreen({ onUnlock, biometricEnabled }: AppLockScreenProps) {
  const {
    password,
    setPassword,
    isLoading,
    biometricAvailable,
    failedAttempts,
    isLockedOut,
    lockEndTime,
    attemptBiometricUnlock,
    handlePasswordUnlock
  } = useAppLockAuth(onUnlock, biometricEnabled);

  const { remainingSeconds } = useLockoutTimer(isLockedOut, lockEndTime);

  // Si biométrie activée, afficher uniquement l'option biométrie
  const showPasswordFallback = !biometricEnabled || !biometricAvailable;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">MyHealth+</h1>
          <p className="text-sm text-muted-foreground">
            {biometricEnabled && biometricAvailable 
              ? "Utilisez la biométrie pour déverrouiller" 
              : "Veuillez vous authentifier pour continuer"}
          </p>
        </div>

        {/* Bouton biométrie principal */}
        {biometricAvailable && biometricEnabled && (
          <Button
            className="w-full gap-2"
            onClick={attemptBiometricUnlock}
            size="lg"
          >
            <Fingerprint className="h-5 w-5" />
            Déverrouiller avec la biométrie
          </Button>
        )}

        {/* Afficher le mot de passe UNIQUEMENT si biométrie non disponible/activée */}
        {showPasswordFallback && (
          <AppLockForm
            password={password}
            setPassword={setPassword}
            isLoading={isLoading}
            lockoutState={{
              isLockedOut,
              failedAttempts,
              remainingSeconds,
              maxAttempts: MAX_ATTEMPTS
            }}
            onSubmit={handlePasswordUnlock}
          />
        )}
      </Card>
    </div>
  );
}
