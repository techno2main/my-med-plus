import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailAuth } from './hooks/useEmailAuth';
import { useBiometricAuth } from './hooks/useBiometricAuth';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { BiometricButton } from './components/BiometricButton';
import { GoogleButton } from './components/GoogleButton';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  const { isSubmitting: isEmailSubmitting, handleSignIn, handleSignUp } = useEmailAuth();
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
    if (isSignUpMode) {
      if (password !== confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      if (password.length < 6) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      // Après inscription réussie, revenir au mode connexion
      handleSignUp(email, password, () => {
        setIsSignUpMode(false);
        setPassword('');
        setConfirmPassword('');
      });
    } else {
      handleSignIn(email, password);
    }
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
            {isSignUpMode 
              ? "Créez votre compte pour commencer" 
              : "Connectez-vous à votre espace santé"}
          </p>
        </div>

        <div className="space-y-4">
          {isSignUpMode ? (
            <SignUpForm
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <LoginForm
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isSignUpMode 
                ? "Vous avez déjà un compte ? Connectez-vous" 
                : "Pas encore de compte ? Inscrivez-vous"}
            </Button>
          </div>
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
          {/* Google OAuth - fonctionne pour connexion ET inscription */}
          <GoogleButton onSignIn={handleGoogleSignIn} isSignUp={isSignUpMode} />
          
          {biometricAvailable && !isSignUpMode && (
            <BiometricButton
              onSignIn={handleBiometricSignIn}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </Card>
    </div>
  );
};

export default Auth;
