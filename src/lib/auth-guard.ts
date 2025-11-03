/**
 * Auth Guard - Utilitaire centralisé pour protéger les appels API Supabase
 * 
 * Ce module fournit des fonctions helper pour s'assurer que tous les appels
 * à Supabase sont effectués uniquement avec un utilisateur authentifié.
 * 
 * UTILISATION:
 * - Remplacer: await supabase.auth.getUser()
 * - Par: await getAuthenticatedUser()
 * 
 * AVANTAGES:
 * - Gestion centralisée des erreurs 403
 * - Logs cohérents
 * - Évite les appels non protégés
 */

import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface AuthGuardResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Vérifie si une session active existe
 * @returns true si l'utilisateur est connecté, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('[AuthGuard] Erreur lors de la vérification de session:', error.message);
      return false;
    }
    
    return !!session;
  } catch (error) {
    console.error('[AuthGuard] Erreur inattendue lors de isAuthenticated:', error);
    return false;
  }
}

/**
 * Récupère l'utilisateur authentifié de manière sécurisée
 * Ne lève PAS d'exception si l'utilisateur n'est pas connecté
 * 
 * @returns AuthGuardResult avec user ou error
 */
export async function getAuthenticatedUser(): Promise<AuthGuardResult<User>> {
  try {
    // Vérifier d'abord qu'une session existe
    const hasSession = await isAuthenticated();
    
    if (!hasSession) {
      return {
        data: null,
        error: new Error('Aucune session active. Utilisateur non authentifié.')
      };
    }

    // Récupérer l'utilisateur
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.warn('[AuthGuard] Erreur lors de getUser:', error.message);
      return {
        data: null,
        error: new Error(`Erreur d'authentification: ${error.message}`)
      };
    }

    if (!user) {
      return {
        data: null,
        error: new Error('Utilisateur non trouvé malgré une session active.')
      };
    }

    return {
      data: user,
      error: null
    };

  } catch (error) {
    console.error('[AuthGuard] Erreur inattendue lors de getAuthenticatedUser:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur inconnue')
    };
  }
}

/**
 * Exécute une fonction uniquement si l'utilisateur est authentifié
 * Utile pour les hooks et composants qui doivent vérifier l'auth avant d'agir
 * 
 * @param fn Fonction à exécuter (reçoit l'utilisateur en paramètre)
 * @returns Résultat de la fonction ou null si non authentifié
 */
export async function withAuth<T>(
  fn: (user: User) => Promise<T>
): Promise<T | null> {
  const { data: user, error } = await getAuthenticatedUser();

  if (error || !user) {
    console.warn('[AuthGuard] withAuth bloqué:', error?.message || 'Pas d\'utilisateur');
    return null;
  }

  try {
    return await fn(user);
  } catch (error) {
    console.error('[AuthGuard] Erreur dans withAuth callback:', error);
    throw error;
  }
}

/**
 * Hook React pour vérifier l'authentification de manière synchrone
 * À utiliser dans un useEffect avec un state local
 * 
 * @example
 * const [isAuth, setIsAuth] = useState(false);
 * 
 * useEffect(() => {
 *   checkAuthStatus().then(setIsAuth);
 * }, []);
 */
export async function checkAuthStatus(): Promise<boolean> {
  return await isAuthenticated();
}

/**
 * Nettoie une session invalide en cas d'erreur 403 ou token expiré
 */
export async function clearInvalidSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
    console.log('[AuthGuard] Session invalide nettoyée');
  } catch (error) {
    console.error('[AuthGuard] Erreur lors du nettoyage de session:', error);
  }
}
