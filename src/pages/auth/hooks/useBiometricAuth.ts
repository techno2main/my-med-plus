import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from 'capacitor-native-biometric';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { BiometricCheckResult } from '../types';

export const useBiometricAuth = () => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkBiometric();

    const handleFocus = () => {
      checkBiometric();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkBiometric = async (): Promise<BiometricCheckResult> => {
    // Ne vérifier que sur plateforme native
    if (!Capacitor.isNativePlatform()) {
      setBiometricAvailable(false);
      setSavedEmail(null);
      return { isAvailable: false, savedEmail: null };
    }

    try {
      // Vérifier si l'appareil supporte la biométrie
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        setBiometricAvailable(false);
        setSavedEmail(null);
        return { isAvailable: false, savedEmail: null };
      }

      // Vérifier si des credentials sont sauvegardés
      const credentials = await NativeBiometric.getCredentials({
        server: "myhealth.app",
      });

      if (credentials.username) {
        setBiometricAvailable(true);
        setSavedEmail(credentials.username);
        return { isAvailable: true, savedEmail: credentials.username };
      } else {
        setBiometricAvailable(false);
        setSavedEmail(null);
        return { isAvailable: false, savedEmail: null };
      }
    } catch (error) {
      // Pas de credentials sauvegardés
      setBiometricAvailable(false);
      setSavedEmail(null);
      return { isAvailable: false, savedEmail: null };
    }
  };

  const signInWithBiometric = async (onEmailPreFill: (email: string) => void) => {
    if (!savedEmail) {
      toast.error('Erreur', {
        description: 'Aucun compte configuré pour la biométrie',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Demander la vérification biométrique
      await NativeBiometric.verifyIdentity({
        reason: "Connexion à MyHealth+",
        title: "Authentification",
        subtitle: "Utilisez votre empreinte digitale ou Face ID",
        description: "Authentifiez-vous pour accéder à votre compte",
      });

      // Si la vérification réussit, récupérer les credentials
      const credentials = await NativeBiometric.getCredentials({
        server: "myhealth.app",
      });

      // Le username contient l'email, le password contient le mot de passe
      const email = credentials.username;
      const password = credentials.password;

      // Utiliser signInWithPassword() pour une vraie connexion
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Biometric signIn error:', error);
        throw new Error('Erreur d\'authentification, veuillez vous reconnecter normalement');
      }

      if (!data.session) {
        throw new Error('Impossible de restaurer la session');
      }
      
      toast.success('Authentification réussie !', {
        description: `Bienvenue ${credentials.username}`,
      });

      // La navigation se fera automatiquement via le useEffect qui détecte user

    } catch (error: any) {
      console.error('Biometric auth error:', error);
      
      // Si le token a expiré, on demande à l'utilisateur de se reconnecter
      if (error.message?.includes('Session') || error.message?.includes('expired')) {
        toast.error('Session expirée', {
          description: 'Veuillez vous reconnecter avec votre mot de passe',
        });
        
        // Pré-remplir l'email pour faciliter la reconnexion
        onEmailPreFill(savedEmail);
      } else {
        toast.error('Échec de l\'authentification', {
          description: 'Authentification biométrique échouée',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    biometricAvailable,
    savedEmail,
    isSubmitting,
    signInWithBiometric,
  };
};
