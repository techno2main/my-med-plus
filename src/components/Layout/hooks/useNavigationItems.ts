import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { getAuthenticatedUser } from "@/lib/auth-guard"
import { useUserRole } from "@/hooks/useUserRole"

/**
 * Hook pour récupérer les éléments de navigation depuis Supabase
 * - ADMIN : affiche navigation_items directement (config globale)
 * - NON-ADMIN : fusionne navigation_items + user_preferences.navigation_menu_preferences
 * @returns Query avec les items de navigation actifs triés par position
 */
export function useNavigationItems() {
  const { isAdmin } = useUserRole()
  
  return useQuery({
    queryKey: ["navigation-items", "active", isAdmin],
    queryFn: async () => {
      // Charger la configuration globale
      const { data: globalItems, error: globalError } = await supabase
        .from("navigation_items")
        .select("*")
        .order("position")
      
      if (globalError) throw globalError
      if (!globalItems) return []
      
      // Si ADMIN, retourner directement les items actifs
      if (isAdmin) {
        return globalItems.filter(item => item.is_active)
      }
      
      // Si NON-ADMIN, fusionner avec les préférences utilisateur
      const { data: user, error: authError } = await getAuthenticatedUser()
      if (authError || !user) {
        // Si pas authentifié, retourner les items actifs par défaut
        return globalItems.filter(item => item.is_active)
      }
      
      // Charger les préférences utilisateur
      const { data: userPrefs } = await supabase
        .from("user_preferences")
        .select("navigation_menu_preferences")
        .eq("user_id", user.id)
        .maybeSingle()
      
      const preferences = (userPrefs?.navigation_menu_preferences as Array<{id: string, is_active: boolean}>) || []
      
      // Fusionner : appliquer les préférences utilisateur sur la config globale
      const mergedItems = globalItems.map(item => {
        const userPref = preferences.find(p => p.id === item.id)
        return {
          ...item,
          is_active: userPref !== undefined ? userPref.is_active : item.is_active
        }
      })
      
      // Retourner uniquement les items actifs
      return mergedItems.filter(item => item.is_active)
    },
  })
}
