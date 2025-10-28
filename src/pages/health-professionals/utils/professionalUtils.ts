export interface HealthProfessional {
  id: string;
  name: string;
  type: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  is_primary_doctor: boolean | null;
  user_id: string;
}

export type ProfessionalType = "doctor" | "pharmacy" | "laboratory";
export type TabType = "medecins" | "pharmacies" | "laboratoires";

const TYPE_MAP: Record<string, string> = {
  medecins: "doctor",
  pharmacies: "pharmacy",
  laboratoires: "laboratory",
  medecin: "doctor",
  pharmacie: "pharmacy",
  laboratoire: "laboratory",
  doctor: "doctor",
  pharmacy: "pharmacy",
  laboratory: "laboratory",
};

export function mapTypeToDb(type: string): string {
  return TYPE_MAP[type] || type;
}

export function filterByType(
  professionals: HealthProfessional[],
  tabType: TabType,
  searchTerm: string
): HealthProfessional[] {
  const mappedType = mapTypeToDb(tabType);

  return professionals.filter(
    (p) =>
      p.type === mappedType &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.specialty?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
}

export function formatAddress(
  street: string | null,
  postalCode: string | null,
  city: string | null
): string | null {
  const parts = [street, postalCode, city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
