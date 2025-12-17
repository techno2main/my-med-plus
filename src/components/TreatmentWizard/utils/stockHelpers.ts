/**
 * Utilitaires pour la gestion des stocks de médicaments
 */

interface ExistingMedication {
  name: string;
  current_stock: number;
  min_threshold: number;
}

// Interface générique pour préserver toutes les propriétés des médicaments
interface MedicationWithThreshold {
  name: string;
  minThreshold: number;
  [key: string]: any; // Permet de préserver toutes les autres propriétés
}

interface StockUpdateResult {
  stockValue: number | null;
  thresholdValue: number | null;
  hasChanges: boolean;
}

/**
 * Trouve un médicament existant par son nom (recherche insensible à la casse)
 */
export const findMatchingMedication = (
  medicationName: string,
  existingMedications: ExistingMedication[]
): ExistingMedication | undefined => {
  return existingMedications.find(
    (em) => em.name.toLowerCase() === medicationName.toLowerCase()
  );
};

/**
 * Détermine si le stock doit être mis à jour
 */
const shouldUpdateStock = (
  index: number,
  currentStocks: Record<number, number>
): boolean => {
  return !(index in currentStocks) || currentStocks[index] === 0;
};

/**
 * Détermine si le seuil d'alerte doit être mis à jour
 */
const shouldUpdateThreshold = (
  currentThreshold: number,
  existingThreshold: number | null | undefined
): boolean => {
  return currentThreshold === 10 && !!existingThreshold;
};

/**
 * Traite un médicament existant et retourne les valeurs à mettre à jour
 */
export const processExistingStock = (
  medication: MedicationWithThreshold,
  index: number,
  existing: ExistingMedication | undefined,
  currentStocks: Record<number, number>
): StockUpdateResult => {
  const result: StockUpdateResult = {
    stockValue: null,
    thresholdValue: null,
    hasChanges: false,
  };

  if (existing) {
    // Médicament trouvé dans les stocks existants
    if (shouldUpdateStock(index, currentStocks)) {
      result.stockValue = existing.current_stock || 0;
      result.hasChanges = true;
    }

    if (shouldUpdateThreshold(medication.minThreshold, existing.min_threshold)) {
      result.thresholdValue = existing.min_threshold;
      result.hasChanges = true;
    }
  } else {
    // Médicament non trouvé - initialiser à 0
    if (!(index in currentStocks)) {
      result.stockValue = 0;
      result.hasChanges = true;
    }
  }

  return result;
};

/**
 * Applique les mises à jour de stocks et seuils
 */
export const applyStockUpdates = <T extends MedicationWithThreshold>(
  medications: T[],
  currentStocks: Record<number, number>,
  existingMedications: ExistingMedication[]
): {
  newStocks: Record<number, number>;
  updatedMedications: T[];
  hasChanges: boolean;
} => {
  const newStocks = { ...currentStocks };
  const updatedMedications = [...medications] as T[];
  let hasChanges = false;

  medications.forEach((med, index) => {
    const existing = findMatchingMedication(med.name, existingMedications);
    const result = processExistingStock(med, index, existing, currentStocks);

    if (result.hasChanges) {
      if (result.stockValue !== null) {
        newStocks[index] = result.stockValue;
      }
      if (result.thresholdValue !== null) {
        updatedMedications[index] = {
          ...updatedMedications[index],
          minThreshold: result.thresholdValue,
        } as T;
      }
      hasChanges = true;
    }
  });

  return { newStocks, updatedMedications, hasChanges };
};
