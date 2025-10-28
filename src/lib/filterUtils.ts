/**
 * filterUtils.ts
 * 
 * Utilitaires de filtrage pour l'application MyHealthPlus
 * Centralise la logique de filtrage par statut is_active
 */

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les objets ayant un statut actif/inactif
 */
export interface TreatmentWithActiveStatus {
  is_active: boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Configuration pour les requêtes Supabase avec filtre is_active
 * 
 * Utilisation dans les queries :
 * ```typescript
 * .select(`
 *   id,
 *   ${ACTIVE_TREATMENT_FILTER.MEDICATIONS_WITH_TREATMENTS}
 * `)
 * .eq(ACTIVE_TREATMENT_FILTER.EQ_CONDITION, ACTIVE_TREATMENT_FILTER.ACTIVE_VALUE)
 * ```
 */
export const ACTIVE_TREATMENT_FILTER = {
  /**
   * Fragment de select pour les medications avec treatments actifs
   * Utilise INNER JOIN pour exclure automatiquement les traitements archivés
   */
  MEDICATIONS_WITH_TREATMENTS: `
    medications!inner(
      id,
      name,
      treatment_id,
      treatments!inner(
        id,
        name,
        is_active,
        start_date,
        end_date
      )
    )
  `.trim(),
  
  /**
   * Condition .eq() pour filtrer les treatments actifs
   * À utiliser après .select()
   */
  EQ_CONDITION: "medications.treatments.is_active" as const,
  
  /**
   * Valeur attendue pour les traitements actifs
   */
  ACTIVE_VALUE: true as const
} as const;

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Compte le nombre de traitements actifs dans un tableau
 * 
 * @param treatments - Tableau de traitements (peut être null/undefined)
 * @returns Nombre de traitements où is_active === true
 * 
 * @example
 * const count = countActiveTreatments(allTreatments);
 * // count = 5
 */
export function countActiveTreatments<T extends TreatmentWithActiveStatus>(
  treatments: T[] | null | undefined
): number {
  if (!treatments || treatments.length === 0) return 0;
  
  return treatments.filter(t => t.is_active).length;
}

/**
 * Filtre un tableau pour ne garder que les traitements actifs
 * 
 * @param treatments - Tableau de traitements (peut être null/undefined)
 * @returns Nouveau tableau contenant uniquement les traitements actifs
 * 
 * @example
 * const active = filterActiveTreatments(allTreatments);
 * // active = [{ is_active: true, ... }, ...]
 */
export function filterActiveTreatments<T extends TreatmentWithActiveStatus>(
  treatments: T[] | null | undefined
): T[] {
  if (!treatments || treatments.length === 0) return [];
  
  return treatments.filter(t => t.is_active);
}

/**
 * Vérifie si un traitement est actif
 * 
 * Fonction helper pour les conditions. Gère les cas null/undefined.
 * 
 * @param treatment - Traitement à vérifier (peut être null/undefined)
 * @returns true si le traitement est actif, false sinon
 * 
 * @example
 * if (isTreatmentActive(treatment)) {
 *   // Traitement actif
 * }
 */
export function isTreatmentActive<T extends TreatmentWithActiveStatus>(
  treatment: T | null | undefined
): treatment is T {
  return treatment?.is_active === true;
}

/**
 * Génère le texte du badge affichant le nombre de traitements actifs
 * 
 * Gère automatiquement le singulier/pluriel et le cas zéro.
 * 
 * @param count - Nombre de traitements actifs
 * @returns Texte formaté pour affichage
 * 
 * @example
 * getActiveTreatmentBadgeText(0);  // "Aucun traitement actif"
 * getActiveTreatmentBadgeText(1);  // "1 traitement actif"
 * getActiveTreatmentBadgeText(5);  // "5 traitements actifs"
 */
export function getActiveTreatmentBadgeText(count: number): string {
  if (count === 0) return "Aucun traitement actif";
  if (count === 1) return "1 traitement actif";
  return `${count} traitements actifs`;
}
