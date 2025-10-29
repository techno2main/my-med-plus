import type { CalendarEvent, IntakeStatus } from '../types';
import { 
  getUTCDateFromDB, 
  createEndDate, 
  determineIntakeStatus,
  formatStatusForTitle 
} from './dateUtils';

/**
 * Couleurs par type d'événement (format hex Android)
 */
const EVENT_COLORS = {
  intake_on_time: '#10B981',    // green-500 - Prise à l'heure
  intake_late: '#F59E0B',        // amber-500 - Prise en retard
  intake_missed: '#EF4444',      // red-500 - Prise manquée
  intake_upcoming: '#3B82F6',    // blue-500 - Prise à venir
  doctor_visit: '#8B5CF6',       // violet-500 - RDV médecin
  pharmacy_visit: '#06B6D4',     // cyan-500 - Visite pharmacie
  prescription_renewal: '#EC4899' // pink-500 - Renouvellement ordonnance
};

/**
 * Calcule les alertes/rappels pour un événement
 * Retourne un tableau de minutes avant l'événement
 */
const getEventAlerts = (eventType: string, status?: IntakeStatus): number[] => {
  // Pour les prises de médicaments
  if (eventType === 'intake') {
    // Si déjà prise ou manquée, pas d'alerte
    if (status === 'on_time' || status === 'missed') {
      return [];
    }
    // Alerte 15 minutes avant pour les prises à venir
    return [15];
  }
  
  // Pour les RDV médecin et pharmacie: alerte 24h et 1h avant
  if (eventType === 'doctor_visit' || eventType === 'pharmacy_visit') {
    return [1440, 60]; // 24h (1440min) et 1h (60min)
  }
  
  // Pour les renouvellements d'ordonnance: alerte 7 jours et 1 jour avant
  if (eventType === 'prescription_renewal') {
    return [10080, 1440]; // 7 jours (10080min) et 1 jour (1440min)
  }
  
  return [];
};

/**
 * Détermine la couleur d'un événement selon son type et statut
 */
const getEventColor = (eventType: string, status?: IntakeStatus): string => {
  if (eventType === 'intake' && status) {
    return EVENT_COLORS[`intake_${status}`] || EVENT_COLORS.intake_upcoming;
  }
  return EVENT_COLORS[eventType] || EVENT_COLORS.intake_upcoming;
};

/**
 * Mappe les prises de médicaments vers des événements calendrier
 */
export const mapIntakesToEvents = (intakes: any[]): CalendarEvent[] => {
  return intakes.map(intake => {
    const startDate = getUTCDateFromDB(intake.scheduled_time);
    const endDate = createEndDate(startDate, 30);
    const status = determineIntakeStatus(intake.scheduled_time, intake.status);
    const statusText = formatStatusForTitle(status);

    const medicationName = intake.medications?.name || 'Médicament';
    const treatmentName = intake.medications?.treatments?.name || '';
    const dosage = intake.medications?.medication_catalog?.form || '';

    return {
      id: `intake_${intake.id}`,
      title: `${statusText} - ${medicationName}`,
      description: `Traitement: ${treatmentName}\nDosage: ${dosage}\nStatut: ${statusText}`,
      startDate,
      endDate,
      eventType: 'intake' as const,
      color: getEventColor('intake', status),
      alerts: getEventAlerts('intake', status),
      metadata: {
        appId: intake.id,
        status,
        medicationName,
        treatmentName
      }
    };
  });
};

/**
 * Mappe les visites pharmacie vers des événements calendrier
 */
export const mapPharmacyVisitsToEvents = (visits: any[]): CalendarEvent[] => {
  return visits.map(visit => {
    // visit_date est une date seule, on crée un événement toute la journée
    const visitDate = new Date(visit.visit_date + 'T09:00:00Z'); // 9h par défaut
    const endDate = createEndDate(visitDate, 60); // 1h de durée

    const pharmacyName = visit.pharmacies?.name || 'Pharmacie';
    const treatmentName = visit.treatments?.name || '';

    return {
      id: `pharmacy_${visit.id}`,
      title: `🏥 Visite pharmacie - ${pharmacyName}`,
      description: `Traitement: ${treatmentName}\nPharmacie: ${pharmacyName}\nVisite #${visit.visit_number}`,
      startDate: visitDate,
      endDate,
      location: visit.pharmacies?.address,
      eventType: 'pharmacy_visit' as const,
      color: getEventColor('pharmacy_visit'),
      alerts: getEventAlerts('pharmacy_visit'),
      metadata: {
        appId: visit.id,
        treatmentName,
        pharmacyName
      }
    };
  });
};

/**
 * Mappe les rendez-vous médecin (fin de traitement) vers des événements calendrier
 */
export const mapDoctorVisitsToEvents = (treatments: any[]): CalendarEvent[] => {
  return treatments
    .filter(t => t.end_date)
    .map(treatment => {
      const endDate = new Date(treatment.end_date + 'T14:00:00Z'); // 14h par défaut
      const appointmentEnd = createEndDate(endDate, 60); // 1h de durée

      const doctorName = treatment.prescriptions?.health_professionals?.name || 'Médecin';

      return {
        id: `doctor_${treatment.id}`,
        title: `👨‍⚕️ RDV Médecin - ${treatment.name}`,
        description: `Fin de traitement: ${treatment.name}\nMédecin: ${doctorName}\nPathologie: ${treatment.pathology || 'Non spécifiée'}`,
        startDate: endDate,
        endDate: appointmentEnd,
        eventType: 'doctor_visit' as const,
        color: getEventColor('doctor_visit'),
        alerts: getEventAlerts('doctor_visit'),
        metadata: {
          appId: treatment.id,
          treatmentName: treatment.name,
          professionalName: doctorName
        }
      };
    });
};

/**
 * Mappe les renouvellements d'ordonnance vers des événements calendrier
 */
export const mapPrescriptionRenewalsToEvents = (prescriptions: any[]): CalendarEvent[] => {
  return prescriptions.map(prescription => {
    const prescriptionDate = new Date(prescription.prescription_date);
    const renewalDate = new Date(prescriptionDate);
    renewalDate.setDate(renewalDate.getDate() + prescription.duration_days - 7); // 7 jours avant expiration
    
    const renewalEnd = createEndDate(renewalDate, 30);

    const doctorName = prescription.health_professionals?.name || 'Médecin';

    return {
      id: `renewal_${prescription.id}`,
      title: `📋 Renouvellement ordonnance`,
      description: `Médecin: ${doctorName}\nDurée: ${prescription.duration_days} jours\nPrévu 7 jours avant expiration`,
      startDate: renewalDate,
      endDate: renewalEnd,
      eventType: 'prescription_renewal' as const,
      color: getEventColor('prescription_renewal'),
      alerts: getEventAlerts('prescription_renewal'),
      metadata: {
        appId: prescription.id,
        professionalName: doctorName
      }
    };
  });
};
