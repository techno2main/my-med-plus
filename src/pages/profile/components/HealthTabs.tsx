import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Activity } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export type HealthTabType = "allergies" | "pathologies";

interface HealthTabsProps {
  allergiesContent: React.ReactNode;
  pathologiesContent: React.ReactNode;
}

export function HealthTabs({ allergiesContent, pathologiesContent }: HealthTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<HealthTabType>("allergies");

  // Lire le paramètre subtab de l'URL au chargement
  useEffect(() => {
    const subtabParam = searchParams.get('subtab');
    if (subtabParam === 'pathologies') {
      setActiveTab('pathologies');
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const newTab = value as HealthTabType;
    setActiveTab(newTab);
    
    // Mettre à jour l'URL
    const params = new URLSearchParams(searchParams);
    params.set('subtab', newTab);
    setSearchParams(params, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="allergies" className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">Allergies</span>
        </TabsTrigger>
        <TabsTrigger value="pathologies" className="flex items-center gap-2">
          <Activity className="h-4 w-4 shrink-0" />
          <span className="text-sm">Pathologies</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="allergies">
        {allergiesContent}
      </TabsContent>

      <TabsContent value="pathologies">
        {pathologiesContent}
      </TabsContent>
    </Tabs>
  );
}
