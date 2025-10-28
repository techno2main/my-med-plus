/**
 * Utilitaire pour nettoyer les tokens d'authentification corrompus
 * Peut être appelé manuellement en cas de problème de session
 */

export const cleanAuthStorage = () => {
  try {
    // Liste des clés Supabase à nettoyer
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    
    console.log(`🧹 Nettoyage de ${supabaseKeys.length} clés d'authentification`);
    
    supabaseKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  ✓ Supprimé: ${key}`);
    });
    
    console.log('✅ Nettoyage terminé');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return false;
  }
};

/**
 * Vérifie si le localStorage contient des tokens invalides
 */
export const hasInvalidTokens = (): boolean => {
  try {
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    
    for (const key of supabaseKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          // Vérifier si c'est un objet de session avec un refresh_token
          if (parsed.refresh_token && !parsed.access_token) {
            console.warn('⚠️ Token invalide détecté:', key);
            return true;
          }
        } catch {
          // Ignore les erreurs de parsing
        }
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des tokens:', error);
    return false;
  }
};

/**
 * Nettoie automatiquement les tokens invalides au démarrage
 */
export const autoCleanInvalidTokens = () => {
  if (hasInvalidTokens()) {
    console.log('🔧 Tokens invalides détectés, nettoyage automatique...');
    cleanAuthStorage();
  }
};
