import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

// URL de production fixe pour éviter les problèmes avec les URLs de preview Lovable
const PRODUCTION_URL = 'https://my-med-plus.lovable.app';

// Détermine la bonne URL de redirection selon la plateforme
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    // Deep link pour l'app mobile - DOIT correspondre au scheme dans AndroidManifest.xml
    return 'com.myhealthplus.app://auth/callback';
  }
  // Toujours utiliser l'URL de production pour OAuth web
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
      async (event, session) => {
        if (isCleanedUp) return;

        // Gérer les événements d'erreur de token
        if (event === 'TOKEN_REFRESHED' && !session) {
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

        // Fermer le navigateur in-app après connexion réussie sur mobile
        if (event === 'SIGNED_IN' && Capacitor.isNativePlatform()) {
          try {
            await Browser.close();
            console.log('✅ Navigateur in-app fermé après connexion');
          } catch (e) {
            // Le navigateur peut déjà être fermé
          }
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
        
        // Fermer le navigateur in-app si ouvert
        try {
          await Browser.close();
        } catch (e) {
          // Ignore
        }
        
        // Extraire les tokens de l'URL de callback
        if (url.includes('auth/callback') || url.includes('access_token') || url.includes('code=')) {
          try {
            // Remplacer le scheme custom par https pour permettre le parsing URL standard
            const normalizedUrl = url.replace('com.myhealthplus.app://', 'https://placeholder/');
            const urlObj = new URL(normalizedUrl);
            
            // Les tokens peuvent être dans le hash (#) OU dans les query params (?)
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            
            // D'abord essayer le hash (fragment) - format implicite
            if (urlObj.hash && urlObj.hash.length > 1) {
              const hashParams = new URLSearchParams(urlObj.hash.substring(1));
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
              console.log('🔍 Tokens dans hash:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });
            }
            
            // Si pas trouvé dans le hash, essayer les query params
            if (!accessToken || !refreshToken) {
              const queryAccess = urlObj.searchParams.get('access_token');
              const queryRefresh = urlObj.searchParams.get('refresh_token');
              if (queryAccess) accessToken = queryAccess;
              if (queryRefresh) refreshToken = queryRefresh;
              console.log('🔍 Tokens dans query:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });
            }
            
            // Vérifier le format avec code (PKCE flow) - le plus courant pour les apps mobiles
            const code = urlObj.searchParams.get('code');
            if (code) {
              console.log('🔑 Code PKCE reçu, échange contre session...');
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) {
                console.error('❌ Erreur exchangeCodeForSession:', error);
              } else {
                console.log('✅ Session OAuth configurée via PKCE:', data.user?.email);
              }
              return;
            }
            
            // Format implicite avec tokens directs
            if (accessToken && refreshToken) {
              console.log('🔑 Tokens OAuth reçus, configuration de la session...');
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('❌ Erreur setSession:', error);
              } else {
                console.log('✅ Session OAuth configurée avec succès:', data.user?.email);
              }
            } else {
              console.warn('⚠️ Ni code PKCE ni tokens trouvés dans l\'URL');
              console.warn('URL complète:', url);
            }
          } catch (err) {
            console.error('❌ Erreur parsing deep link:', err);
          }
        }
      }).then(listener => {
        appUrlListener = listener;
      });
    }

    // Check for existing session
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (isCleanedUp) return;

        if (error) {
          await supabase.auth.signOut().catch(() => {});
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session) {
          const { error: userError } = await supabase.auth.getUser();
          if (userError) {
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
    const isNative = Capacitor.isNativePlatform();
    
    console.log('🔐 Google OAuth - Platform:', isNative ? 'Mobile' : 'Web');
    console.log('🔐 Google OAuth - Redirect URL:', redirectUrl);
    
    try {
      if (isNative) {
        // Sur mobile natif : utiliser le navigateur in-app
        // On récupère l'URL OAuth et on l'ouvre manuellement
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // On gère l'ouverture nous-mêmes
          },
        });
        
        if (error) {
          console.error('❌ Erreur OAuth:', error);
          return { error };
        }
        
        if (data?.url) {
          console.log('🌐 Ouverture du navigateur in-app pour OAuth...');
          // Ouvrir dans le navigateur in-app de Capacitor
          await Browser.open({ 
            url: data.url,
            presentationStyle: 'popover', // iOS: popover style
            toolbarColor: '#1a1a2e', // Couleur de la barre d'outils
          });
        } else {
          console.error('❌ Pas d\'URL OAuth retournée');
          return { error: new Error('Pas d\'URL OAuth retournée') as any };
        }
        
        return { error: null };
      } else {
        // Sur web : comportement standard
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          },
        });
        return { error };
      }
    } catch (err) {
      console.error('❌ Erreur inattendue OAuth:', err);
      return { error: err as any };
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
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
