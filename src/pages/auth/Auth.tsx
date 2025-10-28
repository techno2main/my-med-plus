import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailAuth } from './hooks/useEmailAuth';
import { useBiometricAuth } from './hooks/useBiometricAuth';
import { LoginForm } from './components/LoginForm';
import { BiometricButton } from './components/BiometricButton';
import { GoogleButton } from './components/GoogleButton';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { isSubmitting: isEmailSubmitting, handleSignIn } = useEmailAuth();
  const { 
    biometricAvailable, 
    isSubmitting: isBiometricSubmitting, 
    signInWithBiometric 
  } = useBiometricAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erreur de connexion', {
        description: error.message,
      });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignIn(email, password);
  };

  const handleBiometricSignIn = () => {
    signInWithBiometric(setEmail);
  };

  const isSubmitting = isEmailSubmitting || isBiometricSubmitting;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6 surface-elevated">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
            MyHealth+
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à votre espace santé
          </p>
        </div>

        <div className="space-y-4">
          <LoginForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <div className="space-y-4">
          {biometricAvailable && (
            <BiometricButton
              onSignIn={handleBiometricSignIn}
              isSubmitting={isSubmitting}
            />
          )}
          
          <GoogleButton onSignIn={handleGoogleSignIn} />
        </div>

        <p className="text-xs text-center text-muted-foreground">
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </Card>
    </div>
  );
};

export default Auth;
