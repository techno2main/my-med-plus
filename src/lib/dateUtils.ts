import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Convertit un timestamp UTC ISO en heure locale française
 * La base Supabase stocke en UTC, on doit convertir pour l'affichage
 */
export const formatToFrenchTime = (utcDateString: string, formatPattern: string = 'HH:mm') => {
  // Utiliser parseISO qui gère correctement les dates ISO UTC
  // parseISO interprète les dates sans 'Z' comme locales, donc on doit forcer UTC
  let isoString = utcDateString;
  
  // Si la date ne se termine pas par Z et contient +00, on remplace par Z
  if (!isoString.endsWith('Z') && isoString.includes('+00')) {
    isoString = isoString.replace('+00', 'Z').replace(' ', 'T');
  }
  // Si la date contient un espace au lieu de T, on le remplace
  else if (isoString.includes(' ') && !isoString.includes('T')) {
    isoString = isoString.replace(' ', 'T');
    if (!isoString.endsWith('Z') && !isoString.includes('+')) {
      isoString += 'Z';
    }
  }
  
  const date = parseISO(isoString);
  
  // Formater avec date-fns (utilise l'heure locale du navigateur)
  const result = format(date, formatPattern, { locale: fr });
  
  return result;
};

/**
 * Convertit une date UTC en heure française et la formate avec date complète
 */
export const formatToFrenchDateTime = (utcDateString: string, formatPattern: string = 'dd/MM/yyyy HH:mm') => {
  const date = new Date(utcDateString);
  return format(date, formatPattern, { locale: fr });
};

/**
 * Convertit une date française en UTC pour l'envoi à Supabase
 */
export const convertFrenchToUTC = (frenchDate: Date) => {
  return frenchDate; // Le navigateur stocke déjà en UTC
};

/**
 * Obtient la date actuelle en heure française
 */
export const getNowInFrenchTime = () => {
  return new Date(); // Le navigateur gère automatiquement
};

/**
 * Formate une date en heure française pour l'affichage
 */
export const formatFrenchDate = (date: Date, formatPattern: string = 'dd/MM/yyyy') => {
  return format(date, formatPattern, { locale: fr });
};

// ============================================================================
// CALCULS DE DATES
// ============================================================================

/**
 * Nombre de millisecondes dans une journée
 * Constante pour éviter le "magic number" répété
 */
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calcule le nombre de jours entre deux dates
 * 
 * Arrondit au supérieur (Math.ceil) pour inclure les jours partiels.
 * Retourne un nombre négatif si endDate < startDate.
 * 
 * @param startDate - Date de début (format ISO string)
 * @param endDate - Date de fin (format ISO string)
 * @returns Nombre de jours entre les deux dates (arrondi supérieur)
 * 
 * @example
 * calculateDaysBetween("2025-10-20", "2025-10-27");
 * // Résultat : 7
 * 
 * calculateDaysBetween("2025-10-20T08:00", "2025-10-20T20:00");
 * // Résultat : 1 (jour partiel arrondi)
 */
export function calculateDaysBetween(
  startDate: string,
  endDate: string
): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Vérifier que les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('[calculateDaysBetween] Date invalide:', { startDate, endDate });
      return 0;
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / MILLISECONDS_PER_DAY;
    
    return Math.ceil(diffDays);
    
  } catch (error) {
    console.error('[calculateDaysBetween] Erreur de calcul:', error);
    return 0;
  }
}

/**
 * Calcule la date de fin à partir d'une date de début et d'une durée
 * 
 * Ajoute le nombre de jours spécifié à la date de début.
 * Retourne la date au format ISO "YYYY-MM-DD".
 * 
 * @param startDate - Date de début (format ISO string)
 * @param durationDays - Nombre de jours à ajouter
 * @returns Date de fin au format "YYYY-MM-DD"
 * 
 * @example
 * calculateEndDate("2025-10-20", 7);
 * // Résultat : "2025-10-27"
 * 
 * calculateEndDate("2025-10-28", 5);
 * // Résultat : "2025-11-02" (changement de mois automatique)
 */
export function calculateEndDate(
  startDate: string,
  durationDays: number
): string {
  try {
    const start = new Date(startDate);
    
    // Vérifier que la date est valide
    if (isNaN(start.getTime())) {
      console.warn('[calculateEndDate] Date de début invalide:', startDate);
      return "";
    }
    
    // Vérifier que la durée est positive
    if (durationDays < 0) {
      console.warn('[calculateEndDate] Durée négative détectée:', durationDays);
    }
    
    // Créer une nouvelle date et ajouter les jours
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);
    
    // Retourner au format YYYY-MM-DD
    return end.toISOString().split('T')[0];
    
  } catch (error) {
    console.error('[calculateEndDate] Erreur de calcul:', error);
    return "";
  }
}

/**
 * Formate une date au format français "jj/mm/aaaa"
 * 
 * Utilise toLocaleDateString avec la locale 'fr-FR'.
 * 
 * @param dateString - Date au format ISO string
 * @returns Date formatée "31/12/2025" ou "-" si invalide
 * 
 * @example
 * formatToFrenchDate("2025-10-27");
 * // Résultat : "27/10/2025"
 * 
 * formatToFrenchDate("2025-10-27T14:30:00Z");
 * // Résultat : "27/10/2025"
 */
export function formatToFrenchDate(
  dateString: string
): string {
  try {
    const date = new Date(dateString);
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      console.warn('[formatToFrenchDate] Date invalide:', dateString);
      return "-";
    }
    
    return date.toLocaleDateString('fr-FR');
    
  } catch (error) {
    console.error('[formatToFrenchDate] Erreur de formatage:', error);
    return "-";
  }
}