// Fonctions utilitaires pour la détection automatique des prises de médicaments

export const detectTakesFromDosage = (posology: string): { count: number; moments: string[] } => {
  const text = posology.toLowerCase().trim();
  
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
      'matin': '09:30',
      'midi': '12:30',
      'apres-midi': '16:00',
      'soir': '19:30',
      'coucher': '22:30',
      'nuit': '03:00'
    };
    
    return detectedMoments.map(moment => timeMap[moment] || '09:30');
  }
  
  // Sinon, utiliser la répartition par défaut
  switch(numberOfTakes) {
    case 1: return ['09:30'];
    case 2: return ['09:30', '19:30'];
    case 3: return ['09:30', '12:30', '19:30'];
    case 4: return ['09:30', '12:30', '16:00', '19:30'];
    default: return Array(numberOfTakes).fill(0).map((_, i) => {
      const hour = 9 + (i * 12 / numberOfTakes);
      return `${Math.floor(hour).toString().padStart(2, '0')}:30`;
    });
  }
};
