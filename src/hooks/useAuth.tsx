import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// URL de production fixe pour éviter les problèmes avec les URLs de preview Lovable
const PRODUCTION_URL = 'https://my-med-plus.lovable.app';

// Détermine la bonne URL de redirection selon la plateforme
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    // Deep link pour l'app mobile
    return 'com.myhealthplus.app://auth/callback';
  }
  // Toujours utiliser l'URL de production pour OAuth web
  // (les URLs de preview Lovable ne sont pas autorisées dans Supabase)
  return `${PRODUCTION_URL}/`;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCleanedUp = false;
    let appUrlListener: any = null;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isCleanedUp) return;

        // Gérer les événements d'erreur de token
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token invalide, nettoyer la session
          setTimeout(() => {
            supabase.auth.signOut().catch(() => {});
          }, 0);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Gérer les deep links pour OAuth sur mobile
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', async ({ url }) => {
        console.log('📱 Deep link reçu:', url);
        
        // Extraire les tokens de l'URL de callback
        if (url.includes('auth/callback') || url.includes('access_token')) {
          try {
            // Parser l'URL pour extraire les paramètres
            const urlObj = new URL(url.replace('com.myhealthplus.app://', 'https://placeholder/'));
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              console.log('🔑 Tokens OAuth reçus, configuration de la session...');
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('❌ Erreur setSession:', error);
              } else {
                console.log('✅ Session OAuth configurée avec succès');
              }
            }
          } catch (err) {
            console.error('❌ Erreur parsing deep link:', err);
          }
        }
      }).then(listener => {
        appUrlListener = listener;
      });
    }

    // THEN check for existing session with error handling
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (isCleanedUp) return;

        if (error) {
          // Nettoyer toute session invalide
          await supabase.auth.signOut().catch(() => {});
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Vérifier si la session est valide
        if (session) {
          // Tester si le token est valide en faisant une requête simple
          const { error: userError } = await supabase.auth.getUser();
          if (userError) {
            // Token invalide, nettoyer
            await supabase.auth.signOut().catch(() => {});
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(async (err) => {
        if (isCleanedUp) return;
        console.error("❌ Erreur inattendue lors de getSession:", err);
        // Nettoyer en cas d'erreur
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => {
      isCleanedUp = true;
      subscription.unsubscribe();
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = getRedirectUrl();
    console.log('🔐 Google OAuth redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: Capacitor.isNativePlatform(),
      },
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Utiliser l'URL de production pour la confirmation email
        emailRedirectTo: `${PRODUCTION_URL}/`,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signUp,
    signIn,
    signOut,
  };
}
