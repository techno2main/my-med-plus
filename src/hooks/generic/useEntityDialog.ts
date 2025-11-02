import { useState } from "react";

/**
 * Hook générique pour gérer l'état d'un dialogue CRUD (Create/Edit)
 * 
 * @template T - Type de l'entité manipulée
 * @template F - Type du formulaire (par défaut = T sans id et user_id)
 * 
 * @param initialFormData - Données initiales du formulaire
 * @returns État et méthodes pour gérer le dialogue
 * 
 * @example
 * ```typescript
 * interface Pathology { id: string; name: string; description: string; }
 * type PathologyForm = Omit<Pathology, 'id' | 'user_id'>;
 * 
 * const dialog = useEntityDialog<Pathology, PathologyForm>({
 *   name: "",
 *   description: ""
 * });
 * 
 * // Ouvrir en mode création
 * dialog.openDialog();
 * 
 * // Ouvrir en mode édition
 * dialog.openDialog(existingPathology);
 * ```
 */
export function useEntityDialog<T extends { id: string }, F = Omit<T, 'id' | 'user_id'>>(
  initialFormData: F
) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<F>(initialFormData);

  /**
   * Ouvre le dialogue
   * @param item - Si fourni, ouvre en mode édition avec les données de l'item
   */
  const openDialog = (item?: T) => {
    if (item) {
      setEditingItem(item);
      // Extraire les données sans id et user_id
      const { id, user_id, created_at, updated_at, ...itemData } = item as any;
      // Convertir les valeurs null en chaînes vides pour les inputs React
      const cleanedData = Object.fromEntries(
        Object.entries(itemData).map(([key, value]) => [key, value ?? ""])
      ) as F;
      setFormData(cleanedData);
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setShowDialog(true);
  };

  /**
   * Ferme le dialogue et réinitialise l'état
   */
  const closeDialog = () => {
    setShowDialog(false);
    setEditingItem(null);
    setFormData(initialFormData);
  };

  /**
   * Indique si le dialogue est en mode édition
   */
  const isEditing = editingItem !== null;

  return {
    showDialog,
    editingItem,
    formData,
    setFormData,
    openDialog,
    closeDialog,
    isEditing,
  };
}
