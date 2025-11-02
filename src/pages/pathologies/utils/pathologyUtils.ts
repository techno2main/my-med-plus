export interface Pathology {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PathologyFormData = Omit<Pathology, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function filterPathologies(pathologies: Pathology[], searchTerm: string): Pathology[] {
  if (!searchTerm.trim()) return pathologies;
  
  const term = searchTerm.toLowerCase();
  return pathologies.filter((pathology) =>
    pathology.name.toLowerCase().includes(term) ||
    pathology.description?.toLowerCase().includes(term)
  );
}
