import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

/**
 * Hook pour récupérer les éléments de navigation depuis Supabase
 * @returns Query avec les items de navigation actifs triés par position
 */
export function useNavigationItems() {
  return useQuery({
    queryKey: ["navigation-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .eq("is_active", true)
        .order("position")
      
      if (error) throw error
      return data
    },
  })
}
