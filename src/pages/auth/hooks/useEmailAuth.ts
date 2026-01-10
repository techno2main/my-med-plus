import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useEmailAuth = () => {
  const { signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    setIsSubmitting(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error('Erreur de connexion', {
        description: error.message,
      });
    }
    
    setIsSubmitting(false);
  };

  const handleSignUp = async (email: string, password: string, onSuccess?: () => void) => {
    setIsSubmitting(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      toast.error('Erreur d\'inscription', {
        description: error.message,
      });
    } else {
      // Message très clair avec action requise
      toast.success('📧 Vérifiez votre boîte mail !', {
        description: `Un email de confirmation a été envoyé à ${email}. Vous devez cliquer sur le lien dans l'email pour activer votre compte avant de pouvoir vous connecter.`,
        duration: 15000, // Afficher 15 secondes pour bien laisser le temps de lire
      });
      
      // Callback pour revenir au mode connexion
      if (onSuccess) {
        onSuccess();
      }
    }
    
    setIsSubmitting(false);
  };

  return {
    isSubmitting,
    handleSignIn,
    handleSignUp,
  };
};
