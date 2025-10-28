import { sortTimeStrings } from "@/lib/sortingUtils";

// Fonctions utilitaires pour la détection automatique des prises
export const detectTakesFromDosage = (dosage: string): { count: number; moments: string[] } => {
  const text = dosage.toLowerCase().trim();
  
  // 1. Priorité aux indications numériques explicites
  const numericMatch = text.match(/(\d+)\s*(fois|x)\s*(par\s*jour|\/jour)/i);
  if (numericMatch) return { count: parseInt(numericMatch[1]), moments: [] };
  
  // 2. Détection par moments de la journée
  const moments = [];
  if (/matin|matinée|lever|réveil/i.test(text)) moments.push('matin');
  if (/midi|déjeuner/i.test(text)) moments.push('midi');
  if (/après.midi|après midi|aprem|apm/i.test(text)) moments.push('apres-midi');
  if (/soir|soirée/i.test(text)) moments.push('soir');
  if (/coucher/i.test(text)) moments.push('coucher');
  if (/nuit|nocturne/i.test(text)) moments.push('nuit');
  
  if (moments.length > 0) return { count: moments.length, moments };
  
  // 3. Détection par conjonctions
  if (/ et | puis | avec /i.test(text)) {
    return { count: text.split(/ et | puis | avec /i).length, moments: [] };
  }
  
  // 4. Par défaut : 1 prise
  return { count: 1, moments: [] };
};

export const getDefaultTimes = (numberOfTakes: number, detectedMoments: string[] = []): string[] => {
  // Si des moments spécifiques ont été détectés, les utiliser
  if (detectedMoments.length > 0) {
    const timeMap: { [key: string]: string } = {
      'matin': '09:30',      // 06:00-11:59 → 09:30
      'midi': '12:30',       // 12:00-12:59 → 12:30
      'apres-midi': '16:00', // 13:00-18:59 → 16:00
      'soir': '19:30',       // 19:00-22:00 → 19:30
      'coucher': '22:30',    // 22:01-23:59 → 22:30
      'nuit': '03:00'        // 00:00-05:59 → 03:00
    };
    
    return detectedMoments.map(moment => timeMap[moment] || '09:00');
  }
  
  // Sinon, utiliser la répartition par défaut
  switch(numberOfTakes) {
    case 1: return ['09:30'];
    case 2: return ['09:30', '19:30'];
    case 3: return ['09:30', '12:30', '19:30'];
    case 4: return ['09:30', '12:30', '16:00', '19:30'];
    default: return Array(numberOfTakes).fill(0).map((_, i) => {
      const hour = 8 + (i * 12 / numberOfTakes);
      return `${Math.floor(hour).toString().padStart(2, '0')}:00`;
    });
  }
};

// Fonction INVERSE : Génère le texte de dosage à partir des horaires
export const generateDosageFromTimes = (times: string[]): string => {
  if (times.length === 0) return "Définir une ou plusieurs prises";
  
  const sortedTimes = sortTimeStrings(times);
  const moments: string[] = [];
  
  sortedTimes.forEach(time => {
    const [hours] = time.split(':').map(Number);
    
    // Plages horaires définies
    if (hours >= 6 && hours < 12) {
      moments.push('le matin');
    } else if (hours >= 12 && hours < 13) {
      moments.push('le midi');
    } else if (hours >= 13 && hours < 19) {
      moments.push('l\'après-midi');
    } else if (hours >= 19 && hours < 22) {
      moments.push('le soir');
    } else if (hours >= 22 || hours < 2) {
      moments.push('au coucher');
    } else {
      moments.push('la nuit');
    }
  });
  
  if (moments.length === 1) {
    return `1 comprimé ${moments[0]}`;
  } else if (moments.length === 2) {
    return `1 comprimé ${moments[0]} et 1 ${moments[1]}`;
  } else {
    const lastMoment = moments.pop();
    return `1 comprimé ${moments.join(', 1 ')} et 1 ${lastMoment}`;
  }
};

export const getStockColor = (stock: number, threshold: number): string => {
  if (stock === 0) return "text-danger";
  if (stock <= threshold) return "text-warning";
  return "text-success";
};

export const getStockBgColor = (stock: number, threshold: number): string => {
  if (stock === 0) return "bg-danger/10";
  if (stock <= threshold) return "bg-warning/10";
  return "bg-success/10";
};
