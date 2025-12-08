import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Fingerprint, Eye, EyeOff } from "lucide-react";
import { NativeBiometric } from "capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppLockScreenProps {
  onUnlock: () => void;
  biometricEnabled: boolean;
}

export function AppLockScreen({ onUnlock, biometricEnabled }: AppLockScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    // Tenter automatiquement la biométrie si disponible et activée
    if (biometricAvailable && biometricEnabled && !attemptingBiometric) {
      setAttemptingBiometric(true);
      attemptBiometricUnlock();
    }
  }, [biometricAvailable, biometricEnabled]);

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

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Erreur d'authentification");
        setIsLoading(false);
        return;
      }

      // Vérifier le mot de passe en tentant une connexion
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (error) {
        toast.error("Mot de passe incorrect");
        setIsLoading(false);
        return;
      }

      onUnlock();
    } catch (error) {
      toast.error("Erreur lors de la vérification");
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordUnlock()}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          <Button
            className="w-full"
            onClick={handlePasswordUnlock}
            disabled={isLoading}
          >
            {isLoading ? "Vérification..." : "Déverrouiller"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
