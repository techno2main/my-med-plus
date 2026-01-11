/**
 * Service d'accès à l'API officielle ANSM
 * Base de Données Publique des Médicaments
 * https://base-donnees-publique.medicaments.gouv.fr/
 */

export interface ANSMMedication {
  codeCIS: string;
  denomination: string;
  formePharmaceutique: string;
  voiesAdministration: string[];
  statutAMM: string;
  commercialisation: string;
  titulaire?: string;
  substanceActive?: string; // Ajouté pour le mapping pathologie
}

// Mapping substance active → pathologie (même logique que l'import)
const SUBSTANCE_TO_PATHOLOGY_MAP: Record<string, string> = {
  'PARACÉTAMOL': 'Douleur/Fièvre',
  'IBUPROFÈNE': 'Douleur/Fièvre',
  'ASPIRINE': 'Prévention cardiovasculaire',
  'AMOXICILLINE': 'Infection bactérienne',
  'METFORMINE': 'Diabète Type 2',
  'ATORVASTATINE': 'Cholestérol',
  'SIMVASTATINE': 'Cholestérol',
  'OMÉPRAZOLE': 'Reflux gastro-œsophagien',
  'LÉVOTHYROXINE': 'Hypothyroïdie',
  'AMLODIPINE': 'Hypertension artérielle',
  'MÉTOPROLOL': 'Hypertension artérielle',
  'ATÉNOLOL': 'Hypertension artérielle',
  'NÉBIVOLOL': 'Hypertension artérielle',
  'HYDROCHLOROTHIAZIDE': 'Hypertension artérielle',
  'INDAPAMIDE': 'Hypertension artérielle',
  'RAMIPRIL': 'Hypertension artérielle',
  'PÉRINDOPRIL': 'Hypertension artérielle',
  'ÉNALAPRIL': 'Hypertension artérielle',
  'LOSARTAN': 'Hypertension artérielle',
  'VALSARTAN': 'Hypertension artérielle',
  'FUROSÉMIDE': 'Insuffisance cardiaque',
  'TRAMADOL': 'Douleur chronique',
  'CODÉINE': 'Douleur chronique',
  'MORPHINE': 'Douleur chronique',
  'ALPRAZOLAM': 'Anxiété',
  'LORAZÉPAM': 'Anxiété',
  'SERTRALINE': 'Dépression',
  'ESCITALOPRAM': 'Dépression',
  'VENLAFAXINE': 'Anxiété',
  'INSULINE': 'Diabète Type 2',
  'DAPAGLIFLOZINE': 'Diabète Type 2',
  'EMPAGLIFLOZINE': 'Diabète Type 2',
  'LIRAGLUTIDE': 'Diabète Type 2',
  'WARFARINE': 'Prévention cardiovasculaire',
  'RIVAROXABAN': 'Prévention cardiovasculaire',
  'APIXABAN': 'Prévention cardiovasculaire',
  'CLOPIDOGREL': 'Prévention cardiovasculaire',
  'TICAGRÉLOR': 'Prévention cardiovasculaire',
};

// Cache pour le fichier compositions (évite les rechargements multiples)
let compositionsCache: Map<string, string> | null = null;
let compositionsLoadingPromise: Promise<Map<string, string>> | null = null;

/**
 * Charge le fichier compositions et crée un cache CIS → substance
 */
async function loadCompositionsCache(): Promise<Map<string, string>> {
  if (compositionsCache) return compositionsCache;
  if (compositionsLoadingPromise) return compositionsLoadingPromise;

  compositionsLoadingPromise = (async () => {
    try {
      const response = await fetch('/datas/CIS_COMPO_bdpm_utf8.txt');
      if (!response.ok) {
        console.warn('[ANSM] Fichier compositions non accessible');
        return new Map();
      }

      const text = await response.text();
      const lines = text.split('\n');
      const cache = new Map<string, string>();

      for (const line of lines) {
        if (!line.trim()) continue;
        const columns = line.split('\t');
        const codeCIS = columns[0]?.trim();
        const substance = columns[3]?.trim().toUpperCase();
        
        if (codeCIS && substance && !cache.has(codeCIS)) {
          cache.set(codeCIS, substance);
        }
      }

      compositionsCache = cache;
      return cache;
    } catch (error) {
      console.error('[ANSM] Erreur chargement compositions:', error);
      return new Map();
    } finally {
      compositionsLoadingPromise = null;
    }
  })();

  return compositionsLoadingPromise;
}

/**
 * Recherche un médicament dans la base officielle ANSM
 * @param searchTerm - Terme de recherche (nom du médicament)
 * @returns Liste des médicaments trouvés avec leurs substances actives
 */
export async function searchANSMApi(searchTerm: string): Promise<ANSMMedication[]> {
  if (!searchTerm || searchTerm.length < 3) {
    return [];
  }

  try {
    // Charger les deux fichiers en parallèle
    const [cisFetch, compositionsMap] = await Promise.all([
      fetch('/datas/CIS_bdpm_utf8.txt'),
      loadCompositionsCache()
    ]);

    if (!cisFetch.ok) {
      console.warn('[ANSM API] Fichier CIS_bdpm_utf8.txt non accessible');
      return [];
    }

    const content = await cisFetch.text();
    const lines = content.split('\n');
    const results: ANSMMedication[] = [];
    const searchLower = normalizeForSearch(searchTerm);

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split('\t');
      if (parts.length < 8) continue;

      const denomination = parts[1]?.trim() || '';
      const denominationNormalized = normalizeForSearch(denomination);

      // Recherche insensible aux accents et casse
      if (denominationNormalized.includes(searchLower)) {
        const codeCIS = parts[0]?.trim() || '';
        const substanceActive = compositionsMap.get(codeCIS);
        
        results.push({
          codeCIS: codeCIS,
          denomination: denomination,
          formePharmaceutique: parts[2]?.trim() || '',
          voiesAdministration: parts[3]?.split(';').map(v => v.trim()) || [],
          statutAMM: parts[4]?.trim() || '',
          commercialisation: parts[6]?.trim() || '',
          titulaire: parts[8]?.trim() || '',
          substanceActive: substanceActive,
        });

        // Limiter à 20 résultats pour performance
        if (results.length >= 20) break;
      }
    }

    return results;
  } catch (error) {
    console.error('[ANSM API] Erreur lors de la recherche:', error);
    return [];
  }
}

/**
 * Normalise une chaîne pour la recherche (retire accents, minuscules)
 */
function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Retire les diacritiques
}

/**
 * Trouve la pathologie associée à une substance active
 * Utilise le même mapping que l'import initial
 */
export function getPathologyFromSubstance(substanceActive: string | undefined): string | null {
  if (!substanceActive) return null;

  // Normaliser la substance pour comparaison (sans accents)
  const normalized = normalizeForSearch(substanceActive.toUpperCase());

  // Chercher dans le mapping
  for (const [substance, pathology] of Object.entries(SUBSTANCE_TO_PATHOLOGY_MAP)) {
    const substanceNormalized = normalizeForSearch(substance);
    if (substanceNormalized === normalized) {
      return pathology;
    }
  }

  return null;
}

/**
 * Convertit un médicament ANSM en format catalog
 */
export function convertANSMToCatalog(ansmMed: ANSMMedication) {
  return {
    name: cleanMedicationName(ansmMed.denomination),
    form: ansmMed.formePharmaceutique,
    strength: extractStrength(ansmMed.denomination),
    description: `Substance active : ${ansmMed.denomination}`,
    is_approved: true,
    pathology: null,
  };
}

function cleanMedicationName(denomination: string): string {
  return denomination
    .replace(/,?\s*\d+(?:[,\.]\d+)?\s*(?:mg|g|ml|µg|UI|%).*$/i, '')
    .replace(/,?\s*(comprimé|gélule|capsule|solution|sirop|poudre).*$/i, '')
    .trim();
}

function extractStrength(denomination: string): string | null {
  const strengthMatch = denomination.match(/(\d+(?:[,\.]\d+)?\s*(?:mg|g|ml|µg|UI|%)(?:\s*\/\s*\d+(?:[,\.]\d+)?\s*(?:mg|g|ml|µg|UI|%))*)/i);
  return strengthMatch ? strengthMatch[1].replace(',', '.') : null;
}
