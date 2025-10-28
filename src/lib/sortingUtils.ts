/**
 * sortingUtils.ts
 * 
 * Utilitaires de tri centralisés pour l'application MyHealthPlus
 * Élimine la duplication de code et garantit la cohérence des tris
 */

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les objets ayant un horaire et un nom de médicament
 * Utilisé pour trier les prises de médicaments
 */
export interface IntakeWithTime {
  time: string;        // Format "HH:MM"
  medication: string;  // Nom du médicament
}

/**
 * Interface pour les médicaments avec horaires multiples
 * Utilisé pour trier les médicaments par leur horaire le plus tôt
 */
export interface MedicationWithTimes {
  name: string;        // Nom du médicament
  times: string[];     // Tableau d'horaires ["08:00", "12:00"]
}

/**
 * Interface pour les traitements avec date de début
 * Utilisé pour trier chronologiquement les traitements
 */
export interface TreatmentWithDate {
  start_date: string;  // Format ISO "YYYY-MM-DD" ou timestamp
}

// ============================================================================
// HELPERS PRIVÉS
// ============================================================================

/**
 * Convertit un horaire "HH:MM" en nombre de minutes depuis minuit
 * @param times - Tableau d'horaires au format "HH:MM"
 * @returns Nombre de minutes du premier horaire, ou Infinity si tableau vide
 * @private
 */
function getEarliestMinutes(times: string[]): number {
  if (!times || times.length === 0) return Infinity;
  
  const minutes = times.map(time => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
  });
  
  return Math.min(...minutes);
}

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Trie un tableau de prises de médicaments par horaire puis nom
 * 
 * Ordre de tri :
 * 1. Par horaire prévu (croissant)
 * 2. Par nom de médicament (alphabétique français)
 * 
 * @param intakes - Tableau de prises à trier
 * @returns Nouveau tableau trié (non mutatif)
 * 
 * @example
 * const sorted = sortIntakesByTimeAndName([
 *   { time: "14:00", medication: "Doliprane", ... },
 *   { time: "08:00", medication: "Ibuprofène", ... }
 * ]);
 * // Résultat : [Ibuprofène 08:00, Doliprane 14:00]
 */
export function sortIntakesByTimeAndName<T extends IntakeWithTime>(
  intakes: T[]
): T[] {
  return [...intakes].sort((a, b) => {
    // Tri primaire : par horaire
    const timeCompare = a.time.localeCompare(b.time);
    if (timeCompare !== 0) return timeCompare;
    
    // Tri secondaire : par nom de médicament (locale française)
    return a.medication.localeCompare(b.medication, 'fr', { sensitivity: 'base' });
  });
}

/**
 * Trie un tableau de médicaments par leur horaire de prise le plus tôt
 * 
 * Ordre de tri :
 * 1. Par horaire le plus tôt dans la journée (croissant)
 * 2. Par nom de médicament (alphabétique français)
 * 
 * Les médicaments sans horaires (times = []) sont placés en fin de liste.
 * 
 * @param medications - Tableau de médicaments à trier
 * @returns Nouveau tableau trié (non mutatif)
 * 
 * @example
 * const sorted = sortMedicationsByEarliestTime([
 *   { name: "Doliprane", times: ["12:00", "20:00"], ... },
 *   { name: "Ibuprofène", times: ["08:00", "14:00"], ... }
 * ]);
 * // Résultat : [Ibuprofène (08:00 le plus tôt), Doliprane (12:00 le plus tôt)]
 */
export function sortMedicationsByEarliestTime<T extends MedicationWithTimes>(
  medications: T[]
): T[] {
  return [...medications].sort((a, b) => {
    const timeA = getEarliestMinutes(a.times);
    const timeB = getEarliestMinutes(b.times);
    
    // Tri primaire : par horaire le plus tôt
    if (timeA !== timeB) return timeA - timeB;
    
    // Tri secondaire : par nom de médicament (locale française)
    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
  });
}

/**
 * Trie un tableau de traitements par date de début
 * 
 * @param treatments - Tableau de traitements à trier
 * @param ascending - true = plus ancien d'abord (défaut), false = plus récent d'abord
 * @returns Nouveau tableau trié (non mutatif)
 * 
 * @example
 * // Tri croissant (plus ancien en premier)
 * const sorted = sortTreatmentsByStartDate(treatments);
 * 
 * // Tri décroissant (plus récent en premier)
 * const sorted = sortTreatmentsByStartDate(treatments, false);
 */
export function sortTreatmentsByStartDate<T extends TreatmentWithDate>(
  treatments: T[],
  ascending: boolean = true
): T[] {
  return [...treatments].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Trie un tableau de strings d'horaires au format "HH:MM"
 * 
 * @param times - Tableau d'horaires à trier
 * @returns Nouveau tableau trié (non mutatif)
 * 
 * @example
 * const sorted = sortTimeStrings(["14:00", "08:00", "20:00"]);
 * // Résultat : ["08:00", "14:00", "20:00"]
 */
export function sortTimeStrings(times: string[]): string[] {
  return [...times].sort((a, b) => a.localeCompare(b));
}
