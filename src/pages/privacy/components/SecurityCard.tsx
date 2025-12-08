import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SecurityCardProps {
  authProvider: string | null;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  requireAuthOnOpen: boolean;
  inactivityTimeoutMinutes: number;
  onPasswordChange: () => void;
  onBiometricToggle: () => void;
  onTwoFactorToggle: () => void;
  onRequireAuthOnOpenToggle: () => void;
  onInactivityTimeoutChange: (minutes: number) => void;
  onDeleteAccount: () => void;
}

const TIMEOUT_OPTIONS = [
  { value: 1, label: "1 minute" },
  { value: 2, label: "2 minutes" },
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
];

export function SecurityCard({
  authProvider,
  biometricEnabled,
  twoFactorEnabled,
  requireAuthOnOpen,
  inactivityTimeoutMinutes,
  onPasswordChange,
  onBiometricToggle,
  onTwoFactorToggle,
  onRequireAuthOnOpenToggle,
  onInactivityTimeoutChange,
  onDeleteAccount,
}: SecurityCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Sécurité du compte</h3>
      </div>
      <div className="space-y-4">
        {/* Changement de mot de passe */}
        {authProvider === 'email' ? (
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={onPasswordChange}
          >
            Changer le mot de passe
          </Button>
        ) : authProvider === 'google' ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Changer le mot de passe
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-medium">Compte Google</p>
                  <p className="text-sm">
                    Votre compte est lié à Google. Le mot de passe est géré par votre compte Google.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pour modifier votre mot de passe, rendez-vous sur myaccount.google.com
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
        
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

        {/* Verrouillage à l'ouverture */}
        <div className="flex items-center justify-between">
          <Label htmlFor="require-auth" className="flex-1 cursor-pointer">
            <p className="font-medium">Verrouiller à l'ouverture</p>
            <p className="text-sm text-muted-foreground">Demander l'authentification à chaque lancement</p>
          </Label>
          <Switch 
            id="require-auth"
            checked={requireAuthOnOpen}
            onCheckedChange={onRequireAuthOnOpenToggle}
          />
        </div>

        {/* Déconnexion automatique */}
        <div className="flex items-center justify-between">
          <Label htmlFor="inactivity-timeout" className="flex-1">
            <p className="font-medium">Déconnexion automatique</p>
            <p className="text-sm text-muted-foreground">Après une période d'inactivité</p>
          </Label>
          <Select
            value={String(inactivityTimeoutMinutes)}
            onValueChange={(value) => onInactivityTimeoutChange(Number(value))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEOUT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Supprimer le compte */}
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            className="w-full justify-start text-danger hover:bg-danger hover:text-white border-danger"
            onClick={onDeleteAccount}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer mon compte
          </Button>
        </div>
      </div>
    </Card>
  );
}
