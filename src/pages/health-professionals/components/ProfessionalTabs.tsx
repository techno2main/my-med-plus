import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProfessionalList } from "./ProfessionalList";
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
  onAdd: (type: "medecin" | "pharmacie" | "laboratoire") => void;
  onEdit: (professional: HealthProfessional) => void;
  onDelete: (id: string) => void;
}

export function ProfessionalTabs({
  activeTab,
  onTabChange,
  professionals,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}: ProfessionalTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="medecins">Médecins</TabsTrigger>
        <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
        <TabsTrigger value="laboratoires">Laboratoires</TabsTrigger>
      </TabsList>

      <TabsContent value="medecins" className="space-y-4">
        <Button className="gradient-primary w-full" onClick={() => onAdd("medecin")}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un médecin
        </Button>
        <ProfessionalList
          professionals={professionals.medecins}
          isLoading={isLoading}
          emptyMessage="Aucun médecin trouvé"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="pharmacies" className="space-y-4">
        <Button className="gradient-primary w-full" onClick={() => onAdd("pharmacie")}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une pharmacie
        </Button>
        <ProfessionalList
          professionals={professionals.pharmacies}
          isLoading={isLoading}
          emptyMessage="Aucune pharmacie trouvée"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TabsContent>

      <TabsContent value="laboratoires" className="space-y-4">
        <Button className="gradient-primary w-full" onClick={() => onAdd("laboratoire")}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un laboratoire
        </Button>
        <ProfessionalList
          professionals={professionals.laboratoires}
          isLoading={isLoading}
          emptyMessage="Aucun laboratoire trouvé"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TabsContent>
    </Tabs>
  );
}
