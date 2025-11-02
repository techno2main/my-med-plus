import type { CalendarEvent, IntakeStatus } from '../types';
import { 
  getUTCDateFromDB, 
  createEndDate, 
  determineIntakeStatus,
  formatStatusForTitle 
} from './dateUtils';

/**
 * Couleurs par type d'événement - Système à DEUX niveaux
 * 
 * NIVEAU 1 : PRISES (style "Rappel") - Tons chauds/lumineux
 * Ces événements sont COURTS (15 min) pour ressembler à des rappels
 */
const INTAKE_COLORS = {
  on_time: '#10B981',      // Vert vif - Prise à l'heure
  late: '#F59E0B',         // Orange - Prise en retard  
  missed: '#EF4444',       // Rouge - Prise manquée
  upcoming: '#3B82F6',     // Bleu clair - Prise à venir
};

/**
 * NIVEAU 2 : RENDEZ-VOUS (style "Événement") - Tons profonds/sombres
 * Ces événements sont LONGS (1h) pour ressembler à des événements classiques
 */
const APPOINTMENT_COLORS = {
  doctor_visit: '#8B5CF6',       // Violet profond - RDV médecin
  lab_visit: '#EC4899',          // Rose fuchsia - Analyses labo
  pharmacy_visit: '#06B6D4',     // Cyan - Visite pharmacie
  prescription_renewal: '#F97316' // Orange profond - Renouvellement
};

/**
 * Durées standard selon le type
 */
const EVENT_DURATIONS = {
  intake: 15,           // 15 min = Style "rappel rapide"
  appointment: 60,      // 1h = Style "événement classique"
  renewal: 30          // 30 min = Événement administratif
};

/**
 * Calcule les alertes/rappels pour un événement
 */
const getEventAlerts = (eventType: string, status?: IntakeStatus): number[] => {
  // Pour les prises de médicaments (style rappel)
  if (eventType === 'intake') {
    if (status === 'on_time' || status === 'missed') {
      return []; // Déjà pris ou manqué
    }
    return [15, 5]; // 15 min et 5 min avant (rappels rapprochés)
  }
  
  // Pour les RDV médecin et pharmacie (style événement)
  if (eventType === 'doctor_visit' || eventType === 'pharmacy_visit' || eventType === 'lab_visit') {
    return [1440, 60]; // 24h et 1h avant (alertes événement classique)
  }
  
  // Pour les renouvellements d'ordonnance
  if (eventType === 'prescription_renewal') {
    return [10080, 1440]; // 7 jours et 1 jour avant
  }
  
  return [];
};

/**
 * Détermine la couleur selon le type et le statut
 */
const getEventColor = (eventType: string, status?: IntakeStatus): string => {
  if (eventType === 'intake' && status) {
    return INTAKE_COLORS[status] || INTAKE_COLORS.upcoming;
  }
  return APPOINTMENT_COLORS[eventType as keyof typeof APPOINTMENT_COLORS] || INTAKE_COLORS.upcoming;
};

/**
 * Mappe les prises de médicaments vers des événements calendrier
 * STYLE RAPPEL : Court (15 min), couleurs vives, alertes rapprochées
 */
export const mapIntakesToEvents = (intakes: any[]): CalendarEvent[] => {
  return intakes.map(intake => {
    const scheduledDate = getUTCDateFromDB(intake.scheduled_time);
    const status = determineIntakeStatus(intake.scheduled_time, intake.status, intake.taken_at);
    const statusIcon = formatStatusForTitle(status);
    
    // Heure de début : toujours l'heure prévue
    const startDate = scheduledDate;
    
    // Heure de fin : 
    // - Si prise effectuée (taken_at existe), utiliser cette heure
    // - Sinon (manquée ou à venir), même heure que le début
    let endDate: Date;
    if (intake.taken_at && status !== 'missed') {
      endDate = getUTCDateFromDB(intake.taken_at);
    } else {
      endDate = new Date(startDate);
    }

    const medicationName = intake.medications?.name || 'Médicament';
    const treatmentName = intake.medications?.treatments?.name || '';
    const dosage = intake.medications?.medication_catalog?.form || '';
    
    // Formater les heures pour l'affichage
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/Paris'
      });
    };
    
    const scheduledTime = formatTime(startDate);
    const actualTime = intake.taken_at ? formatTime(getUTCDateFromDB(intake.taken_at)) : scheduledTime;
    
    // Statut avec icône et texte pour la description
    const statusText = {
      on_time: '⊚ À l\'heure',
      late: '⏰ En retard',
      missed: '⊗ Manquée',
      upcoming: '○ À venir'
    }[status];

    return {
      id: `intake_${intake.id}`,
      title: `${statusIcon} ${medicationName}`,
      description: `DETAILS
Traitement : ${treatmentName}
Médicament : ${medicationName} ${dosage}
Heure de prise prévue : ${scheduledTime}
Heure de prise réelle : ${actualTime}
Statut : ${statusText}`,
      startDate,
      endDate,
      eventType: 'intake' as const,
      color: getEventColor('intake', status),
      alerts: getEventAlerts('intake', status),
      isReminder: true, // STYLE RAPPEL
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
 * STYLE ÉVÉNEMENT : Long (1h), couleur profonde, alertes espacées
 */
export const mapPharmacyVisitsToEvents = (visits: any[]): CalendarEvent[] => {
  return visits.map(visit => {
    const visitDate = new Date(visit.visit_date + 'T09:00:00Z');
    const endDate = createEndDate(visitDate, EVENT_DURATIONS.appointment); // 1h

    const pharmacyName = visit.health_professionals?.name || 'Pharmacie';
    const treatmentName = visit.treatments?.name || '';
    const address = visit.health_professionals?.street_address || '';

    return {
      id: `pharmacy_${visit.id}`,
      title: `🏥 Visite pharmacie - ${pharmacyName}`,
      description: `[RENDEZ-VOUS]\nTraitement: ${treatmentName}\nPharmacie: ${pharmacyName}\nVisite #${visit.visit_number}${address ? `\nAdresse: ${address}` : ''}`,
      startDate: visitDate,
      endDate,
      location: address,
      eventType: 'pharmacy_visit' as const,
      color: getEventColor('pharmacy_visit'),
      alerts: getEventAlerts('pharmacy_visit'),
      isReminder: false, // STYLE ÉVÉNEMENT
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
 * STYLE ÉVÉNEMENT : Long (1h), couleur profonde, alertes espacées
 */
export const mapDoctorVisitsToEvents = (treatments: any[]): CalendarEvent[] => {
  return treatments
    .filter(t => t.end_date)
    .map(treatment => {
      const endDate = new Date(treatment.end_date + 'T14:00:00Z');
      const appointmentEnd = createEndDate(endDate, EVENT_DURATIONS.appointment); // 1h

      const doctorName = treatment.prescriptions?.health_professionals?.name || 'Médecin';

      return {
        id: `doctor_${treatment.id}`,
        title: `👨‍⚕️ RDV Médecin - ${treatment.name}`,
        description: `[RENDEZ-VOUS]\nFin de traitement: ${treatment.name}\nMédecin: ${doctorName}\nPathologie: ${treatment.pathology || 'Non spécifiée'}`,
        startDate: endDate,
        endDate: appointmentEnd,
        eventType: 'doctor_visit' as const,
        color: getEventColor('doctor_visit'),
        alerts: getEventAlerts('doctor_visit'),
        isReminder: false, // STYLE ÉVÉNEMENT
        metadata: {
          appId: treatment.id,
          treatmentName: treatment.name,
          professionalName: doctorName
        }
      };
    });
};

/**
 * Mappe les analyses laboratoire vers des événements calendrier
 * STYLE ÉVÉNEMENT : Long (1h), couleur profonde
 */
export const mapLabVisitsToEvents = (labVisits: any[]): CalendarEvent[] => {
  return labVisits.map(visit => {
    const visitDate = new Date(visit.visit_date + 'T08:00:00Z'); // 8h par défaut pour les labos
    const endDate = createEndDate(visitDate, EVENT_DURATIONS.appointment); // 1h

    const labName = visit.lab_name || 'Laboratoire';
    const testType = visit.test_type || 'Analyses';

    return {
      id: `lab_${visit.id}`,
      title: `🔬 ${testType} - ${labName}`,
      description: `[RENDEZ-VOUS]\nType: ${testType}\nLaboratoire: ${labName}`,
      startDate: visitDate,
      endDate,
      eventType: 'doctor_visit' as const, // Utilise doctor_visit comme type générique
      color: APPOINTMENT_COLORS.lab_visit,
      alerts: getEventAlerts('lab_visit'),
      isReminder: false, // STYLE ÉVÉNEMENT
      metadata: {
        appId: visit.id,
        professionalName: labName
      }
    };
  });
};

/**
 * Mappe les renouvellements d'ordonnance vers des événements calendrier
 * STYLE ÉVÉNEMENT : Moyen (30 min), couleur administrative
 */
export const mapPrescriptionRenewalsToEvents = (prescriptions: any[]): CalendarEvent[] => {
  return prescriptions.map(prescription => {
    const prescriptionDate = new Date(prescription.prescription_date);
    const renewalDate = new Date(prescriptionDate);
    renewalDate.setDate(renewalDate.getDate() + prescription.duration_days - 7);
    
    const renewalEnd = createEndDate(renewalDate, EVENT_DURATIONS.renewal); // 30 min

    const doctorName = prescription.health_professionals?.name || 'Médecin';

    return {
      id: `renewal_${prescription.id}`,
      title: `📋 Renouvellement ordonnance`,
      description: `[ÉVÉNEMENT ADMINISTRATIF]\nMédecin: ${doctorName}\nDurée: ${prescription.duration_days} jours\nÀ renouveler 7 jours avant expiration`,
      startDate: renewalDate,
      endDate: renewalEnd,
      eventType: 'prescription_renewal' as const,
      color: getEventColor('prescription_renewal'),
      alerts: getEventAlerts('prescription_renewal'),
      isReminder: false, // STYLE ÉVÉNEMENT
      metadata: {
        appId: prescription.id,
        professionalName: doctorName
      }
    };
  });
};

/**
 * Légende des couleurs pour l'interface
 */
export const COLOR_LEGEND = {
  intakes: {
    title: 'Prises de médicaments (style Rappel)',
    duration: '15 minutes',
    colors: [
      { name: 'À l\'heure', color: INTAKE_COLORS.on_time, emoji: '✅' },
      { name: 'En retard', color: INTAKE_COLORS.late, emoji: '⏰' },
      { name: 'Manquée', color: INTAKE_COLORS.missed, emoji: '❌' },
      { name: 'À venir', color: INTAKE_COLORS.upcoming, emoji: '📅' }
    ]
  },
  appointments: {
    title: 'Rendez-vous (style Événement)',
    duration: '1 heure',
    colors: [
      { name: 'RDV Médecin', color: APPOINTMENT_COLORS.doctor_visit, emoji: '👨‍⚕️' },
      { name: 'Analyses Labo', color: APPOINTMENT_COLORS.lab_visit, emoji: '🔬' },
      { name: 'Visite Pharmacie', color: APPOINTMENT_COLORS.pharmacy_visit, emoji: '🏥' },
      { name: 'Renouvellement', color: APPOINTMENT_COLORS.prescription_renewal, emoji: '📋' }
    ]
  }
};