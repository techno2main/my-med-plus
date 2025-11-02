/**
 * Utilitaires de gestion des dates pour la synchronisation calendrier
 * CRITIQUE: Les dates en BDD sont en UTC, on les récupère telles quelles
 * sans conversion pour les synchroniser au calendrier natif
 */

import { getCurrentDateInParis } from '@/lib/dateUtils';

/**
 * Récupère une date UTC depuis la BDD sans conversion
 * La date reste en UTC pour synchronisation correcte
 */
export const getUTCDateFromDB = (utcDateString: string): Date => {
  return new Date(utcDateString);
};

/**
 * Crée une date de fin (+30min par défaut pour les prises de médicaments)
 */
export const createEndDate = (startDate: Date, durationMinutes: number = 30): Date => {
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  return endDate;
};

/**
 * Filtre les événements à partir du 13/10/2025
 */
export const filterEventsFromStartDate = <T extends { scheduled_time?: string; visit_date?: string; prescription_date?: string }>(
  events: T[]
): T[] => {
  const startDate = new Date('2025-10-13T00:00:00Z');
  const now = getCurrentDateInParis(); // CRITIQUE: Utiliser l'heure de Paris
  
  return events.filter(event => {
    const eventDate = event.scheduled_time 
      ? new Date(event.scheduled_time)
      : event.visit_date
      ? new Date(event.visit_date)
      : event.prescription_date
      ? new Date(event.prescription_date)
      : null;
    
    if (!eventDate) return false;
    
    // Inclure uniquement les événements >= 13/10/2025 OU >= maintenant
    return eventDate >= startDate || eventDate >= now;
  });
};

/**
 * Détermine le statut d'une prise de médicament
 * CRITIQUE: Utilise le statut de la BDD + taken_at pour calculer retard
 */
export const determineIntakeStatus = (scheduledTime: string, status: string, takenAt?: string | null): 'on_time' | 'late' | 'missed' | 'upcoming' => {
  const now = getCurrentDateInParis();
  const scheduled = new Date(scheduledTime);
  const timeDiff = now.getTime() - scheduled.getTime();
  const minutesDiff = timeDiff / (1000 * 60);

  // STATUS BDD: 'taken', 'pending', 'missed', 'skipped'
  
  if (status === 'taken') {
    // La prise a été validée - vérifier si elle était à l'heure ou en retard
    if (takenAt) {
      const actualTime = new Date(takenAt);
      const delayMinutes = (actualTime.getTime() - scheduled.getTime()) / (1000 * 60);
      
      // Si prise plus de 30min après l'heure prévue = en retard
      if (delayMinutes > 30) {
        return 'late';
      }
    }
    // Prise à l'heure (ou pas d'info taken_at)
    return 'on_time';
  }

  if (status === 'missed' || status === 'skipped') {
    // Explicitement manquée ou sautée dans l'app
    return 'missed';
  }

  // Status = 'pending' (en attente)
  if (scheduled > now) {
    // Heure pas encore atteinte
    return 'upcoming';
  }

  // Heure dépassée mais pas encore validée
  if (minutesDiff > 30) {
    // Plus de 30min de retard
    return 'late';
  }

  // Dans la fenêtre de 30min
  return 'upcoming';
};

/**
 * Formate le statut pour affichage dans le titre de l'événement
 * Retourne uniquement l'icône (sans texte)
 */
export const formatStatusForTitle = (status: 'on_time' | 'late' | 'missed' | 'upcoming'): string => {
  const statusMap = {
    on_time: '⊚',      // Circle check - À l'heure
    late: '⏰',         // Clock alert - En retard
    missed: '⊗',       // Circle X - Manquée
    upcoming: '○'      // Circle - À venir
  };
  return statusMap[status];
};