import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SignUpFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const SignUpForm = ({
  email,
  password,
  confirmPassword,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  isSubmitting
}: SignUpFormProps) => {
  const passwordsMatch = password === confirmPassword || confirmPassword === '';
  const isPasswordValid = password.length >= 6 || password === '';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-signup">Email</Label>
        <Input
          id="email-signup"
          type="email"
          placeholder="votre@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password-signup">Mot de passe</Label>
        <Input
          id="password-signup"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          minLength={6}
        />
        {!isPasswordValid && (
          <p className="text-xs text-destructive">
            Le mot de passe doit contenir au moins 6 caractères
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          required
        />
        {!passwordsMatch && confirmPassword && (
          <p className="text-xs text-destructive">
            Les mots de passe ne correspondent pas
          </p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full gradient-primary" 
        disabled={isSubmitting || !passwordsMatch || !isPasswordValid}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer un compte"}
      </Button>
    </form>
  );
};
