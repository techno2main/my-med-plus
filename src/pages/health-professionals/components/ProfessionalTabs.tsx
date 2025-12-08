import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfessionalList } from "./ProfessionalList";
import { Stethoscope, Building2, FlaskConical } from "lucide-react";
import type { HealthProfessional, TabType } from "../utils/professionalUtils";

interface ProfessionalTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  professionals: {
    medecins: HealthProfessional[];
    pharmacies: HealthProfessional[];
    laboratoires: HealthProfessional[];
  };
  isLoading: boolean;
  onEdit: (professional: HealthProfessional) => void;
  onDelete: (id: string) => void;
  onAdd: (type: "medecin" | "pharmacie" | "laboratoire") => void;
}

export function ProfessionalTabs({
  activeTab,
  onTabChange,
  professionals,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
}: ProfessionalTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="medecins">Médecins</TabsTrigger>
        <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
        <TabsTrigger value="laboratoires">Laboratoires</TabsTrigger>
      </TabsList>

      <TabsContent value="medecins" className="space-y-4">
        <ProfessionalList
          professionals={professionals.medecins}
          isLoading={isLoading}
          emptyIcon={Stethoscope}
          emptyIconColor="text-blue-500"
          emptyTitle="Aucun médecin enregistré"
          emptyDescription="Ajoutez vos médecins pour gérer facilement vos consultations"
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={() => onAdd("medecin")}
        />
      </TabsContent>

      <TabsContent value="pharmacies" className="space-y-4">
        <ProfessionalList
          professionals={professionals.pharmacies}
          isLoading={isLoading}
          emptyIcon={Building2}
          emptyIconColor="text-green-500"
          emptyTitle="Aucune pharmacie enregistrée"
          emptyDescription="Ajoutez votre pharmacie pour faciliter le suivi de vos médicaments"
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={() => onAdd("pharmacie")}
        />
      </TabsContent>

      <TabsContent value="laboratoires" className="space-y-4">
        <ProfessionalList
          professionals={professionals.laboratoires}
          isLoading={isLoading}
          emptyIcon={FlaskConical}
          emptyIconColor="text-purple-500"
          emptyTitle="Aucun laboratoire enregistré"
          emptyDescription="Ajoutez vos laboratoires pour gérer vos analyses"
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={() => onAdd("laboratoire")}
        />
      </TabsContent>
    </Tabs>
  );
}
