import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface SecurityCardProps {
  authProvider: string | null;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  onPasswordChange: () => void;
  onBiometricToggle: () => void;
  onTwoFactorToggle: () => void;
}

export function SecurityCard({
  authProvider,
  biometricEnabled,
  twoFactorEnabled,
  onPasswordChange,
  onBiometricToggle,
  onTwoFactorToggle,
}: SecurityCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Sécurité du compte</h3>
      </div>
      <div className="space-y-4">
        {/* Changement de mot de passe - uniquement pour auth email */}
        {authProvider === 'email' && (
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={onPasswordChange}
          >
            Changer le mot de passe
          </Button>
        )}
        
        {/* Biométrie */}
        <div className="flex items-center justify-between">
          <Label htmlFor="biometric" className="flex-1 cursor-pointer">
            <p className="font-medium">Authentification biométrique</p>
            <p className="text-sm text-muted-foreground">Face ID / Empreinte digitale</p>
          </Label>
          <Switch 
            id="biometric"
            checked={biometricEnabled}
            onCheckedChange={onBiometricToggle}
          />
        </div>
        
        {/* 2FA */}
        <div className="flex items-center justify-between">
          <Label htmlFor="2fa" className="flex-1 cursor-pointer">
            <p className="font-medium">Authentification à deux facteurs</p>
            <p className="text-sm text-muted-foreground">Protection supplémentaire</p>
          </Label>
          <Switch 
            id="2fa"
            checked={twoFactorEnabled}
            onCheckedChange={onTwoFactorToggle}
          />
        </div>
      </div>
    </Card>
  );
}
