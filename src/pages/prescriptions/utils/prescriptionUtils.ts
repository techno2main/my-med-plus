export interface PrescriptionStatus {
  status: "active" | "expiring" | "expired";
  daysUntilExpiry: number;
}

/**
 * Calcule la date d'expiration d'une prescription
 */
export function calculateExpiryDate(prescriptionDate: string, durationDays: number): Date {
  const prescDate = new Date(prescriptionDate);
  const expiryDate = new Date(prescDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  return expiryDate;
}

/**
 * Détermine le statut d'une prescription en fonction de sa date d'expiration
 */
export function getPrescriptionStatus(expiryDate: Date): PrescriptionStatus {
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let status: "active" | "expiring" | "expired";
  if (daysUntilExpiry < 0) {
    status = "expired";
  } else if (daysUntilExpiry <= 30) {
    status = "expiring";
  } else {
    status = "active";
  }

  return { status, daysUntilExpiry };
}

/**
 * Formate une date au format français
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR");
}

/**
 * Calcule le QSP (Quantité Suffisante Pour) à afficher
 */
export function formatQSP(durationDays: number): string {
  if (durationDays === 30 || durationDays === 31) return "QSP 1 mois";
  if (durationDays === 90 || durationDays === 91) return "QSP 3 mois";
  if (durationDays === 180 || durationDays === 182) return "QSP 6 mois";
  if (durationDays === 365 || durationDays === 366) return "QSP 1 an";
  return `QSP ${durationDays} jours`;
}
