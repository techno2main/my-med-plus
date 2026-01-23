import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { useUserRole } from "@/hooks/useUserRole";

export function useNavigationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();

  const createMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase
        .from("navigation_items")
        .insert([item]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      toast({ title: "Item ajouté avec succès" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: any }) => {
      const { error } = await supabase
        .from("navigation_items")
        .update(item)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      toast({ title: "Item modifié avec succès" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("navigation_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      toast({ title: "Item supprimé avec succès" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'item",
        variant: "destructive",
      });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; is_active: boolean }>) => {
      if (isAdmin) {
        // ADMIN : modifier navigation_items (config globale)
        const promises = updates.map(({ id, is_active }) =>
          supabase
            .from("navigation_items")
            .update({ is_active })
            .eq("id", id)
        );
        
        const results = await Promise.all(promises);
        console.log('[toggleVisibilityMutation] Résultats ADMIN:', results);
        
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          console.error('[toggleVisibilityMutation] Erreurs ADMIN:', errors);
          throw new Error('Erreur lors de la mise à jour');
        }
      } else {
        // NON-ADMIN : sauvegarder dans user_preferences
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        
        // Charger les préférences actuelles pour préserver les positions
        const { data: existingPrefs } = await supabase
          .from("user_preferences")
          .select("navigation_menu_preferences")
          .eq("user_id", user.id)
          .maybeSingle() as { data: { navigation_menu_preferences?: Array<{id: string, is_active: boolean, position?: number}> } | null };
        
        let currentPreferences = existingPrefs?.navigation_menu_preferences || [];
        
        // Mettre à jour uniquement is_active, conserver les positions existantes
        updates.forEach(({ id, is_active }) => {
          const existingPrefIndex = currentPreferences.findIndex(p => p.id === id);
          if (existingPrefIndex !== -1) {
            currentPreferences[existingPrefIndex].is_active = is_active;
          } else {
            currentPreferences.push({ id, is_active });
          }
        });
        
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            navigation_menu_preferences: currentPreferences
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error('Erreur sauvegarde préférences:', error);
          throw error;
        }
      }
    },
    onSuccess: async () => {
      // Invalider TOUS les caches liés à la navigation pour forcer un rechargement complet
      await queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      
      toast({ 
        title: "✓ Modifications enregistrées", 
        duration: 1500,
        className: "bottom-20" // Pour ne pas masquer la barre de navigation
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les modifications",
        variant: "destructive",
      });
    },
  });

  const updatePositionsMutation = useMutation({
    mutationFn: async (items: Array<{ id: string; position: number }>) => {
      if (isAdmin) {
        // ADMIN : mettre à jour navigation_items directement (ordre global)
        for (const { id, position } of items) {
          const { error } = await supabase
            .from("navigation_items")
            .update({ position })
            .eq("id", id);
          
          if (error) throw error;
        }
      } else {
        // NON-ADMIN : sauvegarder dans user_preferences (ordre personnel)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        
        // Charger les préférences actuelles
        const { data: existingPrefs } = await supabase
          .from("user_preferences")
          .select("navigation_menu_preferences")
          .eq("user_id", user.id)
          .maybeSingle() as { data: { navigation_menu_preferences?: Array<{id: string, is_active: boolean, position?: number}> } | null };
        
        let currentPreferences = existingPrefs?.navigation_menu_preferences || [];
        
        // Mettre à jour les positions dans les préférences
        items.forEach(({ id, position }) => {
          const existingPrefIndex = currentPreferences.findIndex(p => p.id === id);
          if (existingPrefIndex !== -1) {
            currentPreferences[existingPrefIndex].position = position;
          } else {
            currentPreferences.push({ id, is_active: true, position });
          }
        });
        
        // Sauvegarder dans user_preferences
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            navigation_menu_preferences: currentPreferences
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error('Erreur sauvegarde positions:', error);
          throw error;
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      toast({ 
        title: isAdmin ? "✓ Ordre global mis à jour" : "✓ Ordre personnalisé enregistré", 
        duration: 2000 
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser les items",
        variant: "destructive",
      });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleVisibilityMutation,
    updatePositionsMutation,
  };
}
