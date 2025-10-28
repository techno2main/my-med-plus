export interface Allergy {
  id: string;
  name: string;
  severity: string | null;
  description: string | null;
}

export type SeverityLevel = "Légère" | "Modérée" | "Sévère";

export function filterAllergies(allergies: Allergy[], searchTerm: string): Allergy[] {
  if (!searchTerm.trim()) return allergies;
  
  const term = searchTerm.toLowerCase();
  return allergies.filter((allergy) =>
    allergy.name.toLowerCase().includes(term) ||
    allergy.description?.toLowerCase().includes(term) ||
    allergy.severity?.toLowerCase().includes(term)
  );
}

export function getSeverityVariant(severity: string | null): "secondary" | "default" | "destructive" | "outline" {
  switch (severity) {
    case "Légère": return "secondary";
    case "Modérée": return "default";
    case "Sévère": return "destructive";
    default: return "outline";
  }
}
