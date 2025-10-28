/**
 * Détermine le statut du stock en fonction du niveau actuel et du seuil minimum
 */
export function getStockStatus(currentStock: number, minThreshold: number): "ok" | "low" | "critical" {
  if (currentStock === 0) return "critical";
  if (currentStock <= minThreshold * 0.5) return "critical";
  if (currentStock <= minThreshold) return "low";
  return "ok";
}

/**
 * Calcule le nombre de jours estimés avant épuisement du stock
 */
export function calculateEstimatedDays(
  currentStock: number,
  takesPerDay: number,
  unitsPerTake: number
): number {
  const dailyConsumption = takesPerDay * unitsPerTake;
  if (dailyConsumption === 0) return 0;
  return Math.floor(currentStock / dailyConsumption);
}

/**
 * Formate un nombre d'unités avec le label approprié
 */
export function formatUnits(count: number, unit: string = "unités"): string {
  return `${count} ${unit}`;
}

/**
 * Parse un ajustement de stock (+10, -5, etc.)
 */
export function parseAdjustment(adjustmentStr: string): number {
  const cleaned = adjustmentStr.trim();
  if (cleaned.startsWith("+")) {
    return parseInt(cleaned.substring(1)) || 0;
  }
  return parseInt(cleaned) || 0;
}

/**
 * Calcule le nouveau stock après ajustement
 */
export function calculateNewStock(currentStock: number, adjustment: number): number {
  return Math.max(0, currentStock + adjustment);
}
