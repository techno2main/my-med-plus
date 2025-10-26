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