import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { toast } from "sonner";

type SupabaseTable = "pathologies" | "allergies" | "health_professionals" | "medications" | "treatments" | "prescriptions";

/**
 * Configuration pour useEntityCrud
 */
export interface EntityCrudConfig<T> {
  /** Nom de la table Supabase */
  tableName: SupabaseTable;
  /** Clé pour React Query (ex: ["pathologies"]) */
  queryKey: string[];
  /** Nom d'affichage de l'entité (ex: "Pathologie", "Allergie") */
  entityName: string;
  /** Champ de tri (défaut: "name") */
  orderBy?: keyof T;
  /** Ajouter automatiquement user_id lors des INSERT (défaut: true) */
  addUserId?: boolean;
  /** Messages personnalisés (optionnel) */
  messages?: {
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
    errorCreate?: string;
    errorUpdate?: string;
    errorDelete?: string;
  };
}

/**
 * Hook générique pour gérer les opérations CRUD d'une entité
 * 
 * Utilise des assertions de type contrôlées (via `unknown`) pour la flexibilité,
 * tout en maintenant un typage strict à l'utilisation côté composant.
 * 
 * @template T - Type de l'entité avec id (ex: Pathology)
 * @template C - Type pour la création (sans id/user_id)
 * @template U - Type pour la mise à jour (sans id/user_id)
 * 
 * @param config - Configuration du hook
 * @returns Données et méthodes CRUD
 * 
 * @example
 * ```typescript
 * interface Pathology { id: string; user_id: string; name: string; description: string | null; }
 * type PathologyCreate = Omit<Pathology, 'id' | 'user_id'>;
 * 
 * const pathologies = useEntityCrud<Pathology, PathologyCreate>({
 *   tableName: "pathologies",
 *   queryKey: ["pathologies"],
 *   entityName: "Pathologie",
 *   orderBy: "name"
 * });
 * ```
 */
export function useEntityCrud<
  T extends { id: string },
  C = Omit<T, 'id' | 'user_id'>,
  U = C
>(config: EntityCrudConfig<T>) {
  const queryClient = useQueryClient();
  
  const {
    tableName,
    queryKey,
    entityName,
    orderBy = 'name' as keyof T,
    addUserId = true,
    messages = {}
  } = config;

  // Messages par défaut
  const msgs = {
    createSuccess: messages.createSuccess || `${entityName} ajouté${entityName.endsWith('e') ? 'e' : ''} avec succès`,
    updateSuccess: messages.updateSuccess || `${entityName} modifié${entityName.endsWith('e') ? 'e' : ''} avec succès`,
    deleteSuccess: messages.deleteSuccess || `${entityName} supprimé${entityName.endsWith('e') ? 'e' : ''}`,
    errorCreate: messages.errorCreate || "Erreur lors de l'enregistrement",
    errorUpdate: messages.errorUpdate || "Erreur lors de la modification",
    errorDelete: messages.errorDelete || "Erreur lors de la suppression",
  };

  // Fetch des données - assertion contrôlée via unknown
  const { data: items = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order(orderBy as string);

      if (error) throw error;
      // Assertion contrôlée : unknown → T[] (le type T est fourni par l'appelant)
      return (data || []) as unknown as T[];
    },
  });

  /**
   * Crée une nouvelle entité
   */
  const create = async (formData: C): Promise<boolean> => {
    try {
      // Nettoyer les strings vides → null pour compatibilité SQL
      const cleanData = Object.fromEntries(
        Object.entries(formData as Record<string, unknown>).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );

      // Ajouter user_id si nécessaire (tables user-owned)
      let dataToInsert = cleanData;
      if (addUserId) {
        const { data: user, error } = await getAuthenticatedUser();
        if (error || !user) {
          console.warn('[useEntityCrud] Utilisateur non authentifié:', error?.message);
          toast.error("Session expirée, veuillez vous reconnecter");
          return false;
        }
        dataToInsert = { ...cleanData, user_id: user.id };
      }

      const { error } = await supabase
        .from(tableName)
        .insert(dataToInsert as never);

      if (error) throw error;

      toast.success(msgs.createSuccess);
      queryClient.invalidateQueries({ queryKey });
      return true;
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error);
      toast.error(msgs.errorCreate);
      return false;
    }
  };

  /**
   * Met à jour une entité existante
   */
  const update = async (id: string, formData: U): Promise<boolean> => {
    try {
      // Nettoyer les strings vides → null pour compatibilité SQL
      const cleanData = Object.fromEntries(
        Object.entries(formData as Record<string, unknown>).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );

      const { error } = await supabase
        .from(tableName)
        .update(cleanData as never)
        .eq("id", id);

      if (error) throw error;

      toast.success(msgs.updateSuccess);
      queryClient.invalidateQueries({ queryKey });
      return true;
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      toast.error(msgs.errorUpdate);
      return false;
    }
  };

  /**
   * Supprime une entité
   */
  const deleteEntity = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(msgs.deleteSuccess);
      queryClient.invalidateQueries({ queryKey });
      return true;
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      toast.error(msgs.errorDelete);
      return false;
    }
  };

  /**
   * Rafraîchit les données manuellement
   */
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    items,
    isLoading,
    error,
    create,
    update,
    deleteEntity,
    refetch,
  };
}
