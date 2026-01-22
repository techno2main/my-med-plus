import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Navigation } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export type PersonnalisationTabType = "apparence" | "menus";

interface PersonnalisationTabsProps {
  apparenceContent: React.ReactNode;
  menusContent: React.ReactNode;
}

export function PersonnalisationTabs({ apparenceContent, menusContent }: PersonnalisationTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<PersonnalisationTabType>("apparence");

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'menus') {
      setActiveTab('menus');
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const newTab = value as PersonnalisationTabType;
    setActiveTab(newTab);
    
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    setSearchParams(params, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <div className="sticky top-[72px] z-20 bg-background pb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apparence" className="flex items-center gap-2">
            <Palette className="h-4 w-4 shrink-0" />
            <span className="text-sm">Apparence</span>
          </TabsTrigger>
          <TabsTrigger value="menus" className="flex items-center gap-2">
            <Navigation className="h-4 w-4 shrink-0" />
            <span className="text-sm">Menus</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="apparence" className="mt-4">
        {apparenceContent}
      </TabsContent>

      <TabsContent value="menus" className="mt-4">
        {menusContent}
      </TabsContent>
    </Tabs>
  );
}
