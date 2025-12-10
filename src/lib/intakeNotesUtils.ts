/**
 * Utilitaire centralisé pour gérer les notes des prises de médicaments
 * Permet de modifier facilement tous les messages en un seul endroit
 */

export const IntakeNotes = {
  /**
   * Note pour une prise effectuée à l'heure (depuis le dashboard)
   * @param actualTime L'heure réelle de la prise au format HH:mm
   */
  takenOnTime: (actualTime: string): string => {
    return `Pris à l'heure, à ${actualTime}`;
  },

  /**
   * Note pour une prise sautée volontairement (depuis le dashboard)
   */
  skippedVoluntarily: (): string => {
    return "Prise sautée volontairement";
  },

  /**
   * Note pour une prise en rattrapage (prise maintenant)
   * @param actualTime L'heure réelle de la prise au format HH:mm
   */
  takenInCatchup: (actualTime: string): string => {
    return `Rattrapage - Marquée comme pris à ${actualTime}`;
  },

  /**
   * Note pour une prise déclarée en retard avec heure exacte
   * @param actualTime L'heure réelle de la prise au format HH:mm
   */
  takenLateWithTime: (actualTime: string): string => {
    return `Rattrapage - Prise avec retard à ${actualTime}`;
  },

  /**
   * Note pour une prise déclarée en retard sans heure exacte
   * @param scheduledTime L'heure prévue de la prise au format HH:mm
   */
  takenLateNoTime: (scheduledTime: string): string => {
    return `Rattrapage - Marquée comme pris à l'heure prévue ${scheduledTime}`;
  },

  /**
   * Note pour une prise en attente (status pending)
   */
  pending: (): string => {
    return "En attente de traitement";
  },

  /**
   * Note pour une prise marquée comme manquée (status missed)
   * Utilisé lors du rattrapage pour indiquer qu'une prise n'a pas été effectuée
   */
  markedAsMissed: (): string => {
    return "Rattrapage - Marquée comme manquée";
  },
};
