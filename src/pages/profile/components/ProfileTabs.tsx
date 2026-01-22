import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Heart, Package } from "lucide-react";

export type ProfileTabType = "profil" | "reseau" | "sante" | "stocks";

export const getTabTitle = (tab: ProfileTabType): { title: string; subtitle: string } => {
  const titles = {
    profil: { title: "Mon profil", subtitle: "Informations personnelles" },
    reseau: { title: "Mon réseau", subtitle: "Professionnels de santé" },
    sante: { title: "Santé", subtitle: "Allergies et pathologies" },
    stocks: { title: "Mes stocks", subtitle: "Suivi des médicaments" },
  };
  return titles[tab];
};

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  children: {
    profil: React.ReactNode;
    reseau: React.ReactNode;
    sante: React.ReactNode;
    stocks: React.ReactNode;
  };
}

export function ProfileTabs({ activeTab, onTabChange, children }: ProfileTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <div className="sticky top-[72px] z-20 bg-background pb-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profil" className="flex items-center gap-1">
            <User className="h-4 w-4 shrink-0" />
            <span className="text-xs truncate">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="reseau" className="flex items-center gap-1">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="text-xs truncate">Réseau</span>
          </TabsTrigger>
          <TabsTrigger value="sante" className="flex items-center gap-1">
            <Heart className="h-4 w-4 shrink-0" />
            <span className="text-xs truncate">Santé</span>
          </TabsTrigger>
          <TabsTrigger value="stocks" className="flex items-center gap-1">
            <Package className="h-4 w-4 shrink-0" />
            <span className="text-xs truncate">Stocks</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="profil" className="mt-4">
        {children.profil}
      </TabsContent>

      <TabsContent value="reseau" className="mt-4">
        {children.reseau}
      </TabsContent>

      <TabsContent value="sante" className="mt-4">
        {children.sante}
      </TabsContent>

      <TabsContent value="stocks" className="mt-4">
        {children.stocks}
      </TabsContent>
    </Tabs>
  );
}
