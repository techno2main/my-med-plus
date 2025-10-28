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

  const handleSignUp = async (email: string, password: string) => {
    setIsSubmitting(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      toast.error('Erreur d\'inscription', {
        description: error.message,
      });
    } else {
      toast.success('Compte créé avec succès !');
    }
    
    setIsSubmitting(false);
  };

  return {
    isSubmitting,
    handleSignIn,
    handleSignUp,
  };
};
