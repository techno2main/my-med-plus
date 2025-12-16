import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

interface AppLockFormProps {
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  isLockedOut: boolean;
  failedAttempts: number;
  remainingSeconds: number;
  maxAttempts: number;
  onSubmit: () => void;
}

export function AppLockForm({
  password,
  setPassword,
  isLoading,
  isLockedOut,
  failedAttempts,
  remainingSeconds,
  maxAttempts,
  onSubmit
}: AppLockFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const remainingAttemptsText = maxAttempts - failedAttempts;

  return (
    <>
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
      {!isLockedOut && failedAttempts > 0 && failedAttempts < maxAttempts && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            {remainingAttemptsText} tentative{remainingAttemptsText > 1 ? 's' : ''} restante{remainingAttemptsText > 1 ? 's' : ''}
          </p>
        </div>
      )}

      <form 
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isLockedOut) onSubmit();
        }}
        data-lpignore="true"
        data-form-type="other"
      >
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLockedOut}
            className={isLockedOut ? "opacity-50" : ""}
            data-lpignore="true"
            data-form-type="other"
            autoComplete="off"
            name="app-lock-password"
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
          type="submit"
          className="w-full"
          disabled={isLoading || isLockedOut}
        >
          {isLoading ? "Vérification..." : isLockedOut ? `Bloqué (${remainingSeconds}s)` : "Déverrouiller"}
        </Button>
      </form>
    </>
  );
}
