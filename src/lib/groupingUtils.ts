/**
 * groupingUtils.ts
 * 
 * Utilitaires de regroupement (grouping) pour l'application MyHealthPlus
 * Centralise la logique métier de regroupement de données
 */

import { parseISO, startOfDay } from 'date-fns';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les prises de médicaments avec ID de traitement
 * Utilisé pour le regroupement par traitement
 */
export interface IntakeWithTreatment {
  treatment_id: string;     // ID unique du traitement
  treatment: string;        // Nom du traitement
  // Autres propriétés de l'intake sont préservées via generic T
}

/**
 * Structure du groupe de prises par traitement
 */
export interface IntakeGroup<T> {
  treatment: string;        // Nom du traitement
  treatmentId: string;      // ID du traitement
  intakes: T[];            // Tableau des prises de ce traitement
}

/**
 * Interface pour les prises avec horaire prévu
 * Utilisé pour le regroupement par jour
 */
export interface IntakeWithScheduledTime {
  scheduled_time: string;  // ISO timestamp ou date string
  // Autres propriétés de l'intake sont préservées via generic T
}

/**
 * Structure du groupe de prises par jour
 */
export interface DayGroup<T> {
  date: Date;              // Date du jour (sans heure, à 00:00)
  dateKey: string;         // Clé ISO pour comparaison/identification unique
  intakes: T[];           // Tableau des prises de ce jour
}

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Regroupe un tableau de prises de médicaments par traitement
 * 
 * Chaque prise est ajoutée au groupe correspondant à son treatment_id.
 * Crée automatiquement un nouveau groupe si le traitement n'existe pas encore.
 * 
 * @param intakes - Tableau de prises à regrouper
 * @returns Objet avec treatment_id comme clé et IntakeGroup comme valeur
 * 
 * @example
 * const grouped = groupIntakesByTreatment([
 *   { treatment_id: "t1", treatment: "Traitement A", medication: "Med1" },
 *   { treatment_id: "t1", treatment: "Traitement A", medication: "Med2" },
 *   { treatment_id: "t2", treatment: "Traitement B", medication: "Med3" }
 * ]);
 * // Résultat : {
 * //   "t1": { treatment: "Traitement A", treatmentId: "t1", intakes: [Med1, Med2] },
 * //   "t2": { treatment: "Traitement B", treatmentId: "t2", intakes: [Med3] }
 * // }
 */
export function groupIntakesByTreatment<T extends IntakeWithTreatment>(
  intakes: T[]
): Record<string, IntakeGroup<T>> {
  const grouped: Record<string, IntakeGroup<T>> = {};
  
  for (const intake of intakes) {
    const treatmentId = intake.treatment_id;
    
    // Validation : ignorer les intakes sans treatment_id
    if (!treatmentId) {
      console.warn('[groupIntakesByTreatment] Intake sans treatment_id ignoré:', intake);
      continue;
    }
    
    // Créer le groupe si n'existe pas
    if (!grouped[treatmentId]) {
      grouped[treatmentId] = {
        treatment: intake.treatment,
        treatmentId: treatmentId,
        intakes: []
      };
    }
    
    // Ajouter l'intake au groupe
    grouped[treatmentId].intakes.push(intake);
  }
  
  return grouped;
}

/**
 * Regroupe un tableau de prises de médicaments par jour
 * 
 * Extrait la date (sans heure) de scheduled_time et groupe toutes les prises
 * du même jour ensemble. Retourne un tableau trié par date croissante.
 * 
 * ⚠️ Cette fonction ne modifie pas les propriétés des intakes (pas de mapping).
 * Le formatage (ex: formatToFrenchTime) doit être fait séparément.
 * 
 * @param intakes - Tableau de prises à regrouper
 * @returns Tableau de groupes par jour, trié chronologiquement
 * 
 * @example
 * const grouped = groupIntakesByDay([
 *   { scheduled_time: "2025-10-27T08:00:00Z", medication: "Med1" },
 *   { scheduled_time: "2025-10-27T14:00:00Z", medication: "Med2" },
 *   { scheduled_time: "2025-10-28T08:00:00Z", medication: "Med3" }
 * ]);
 * // Résultat : [
 * //   { date: Date(2025-10-27), dateKey: "...", intakes: [Med1, Med2] },
 * //   { date: Date(2025-10-28), dateKey: "...", intakes: [Med3] }
 * // ]
 */
export function groupIntakesByDay<T extends IntakeWithScheduledTime>(
  intakes: T[]
): DayGroup<T>[] {
  const grouped: Record<string, DayGroup<T>> = {};
  
  for (const intake of intakes) {
    try {
      // Extraire la date sans heure
      const date = startOfDay(parseISO(intake.scheduled_time));
      const dateKey = date.toISOString();
      
      // Créer le groupe si n'existe pas
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: date,
          dateKey: dateKey,
          intakes: []
        };
      }
      
      // Ajouter l'intake au groupe
      grouped[dateKey].intakes.push(intake);
      
    } catch (error) {
      console.warn('[groupIntakesByDay] Erreur parsing scheduled_time:', intake.scheduled_time, error);
      continue;
    }
  }
  
  // Convertir en tableau et trier par date
  return Object.values(grouped).sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );
}
