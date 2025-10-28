export interface Pathology {
  id: string;
  name: string;
  description: string | null;
}

export function filterPathologies(pathologies: Pathology[], searchTerm: string): Pathology[] {
  if (!searchTerm.trim()) return pathologies;
  
  const term = searchTerm.toLowerCase();
  return pathologies.filter((pathology) =>
    pathology.name.toLowerCase().includes(term) ||
    pathology.description?.toLowerCase().includes(term)
  );
}
