import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Fingerprint, Loader2 } from "lucide-react";

interface BiometricButtonProps {
  onSignIn: () => void;
  isSubmitting: boolean;
}

export const BiometricButton = ({ onSignIn, isSubmitting }: BiometricButtonProps) => {
  return (
    <>
      <Button
        onClick={onSignIn}
        variant="default"
        className="w-full h-12 text-base gradient-primary"
        disabled={isSubmitting}
      >
        <Fingerprint className="w-5 h-5 mr-2" />
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : 'Se connecter avec biométrie'}
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou avec mot de passe</span>
        </div>
      </div>
    </>
  );
};
