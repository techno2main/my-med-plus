import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CalendarSync, Shield } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export type ReglagesTabType = "notifications" | "synchronisation" | "securite";

interface ReglagesTabsProps {
  notificationsContent: React.ReactNode;
  synchronisationContent: React.ReactNode;
  securiteContent: React.ReactNode;
}

export function ReglagesTabs({ notificationsContent, synchronisationContent, securiteContent }: ReglagesTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ReglagesTabType>("notifications");

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'synchronisation' || tabParam === 'securite') {
      setActiveTab(tabParam as ReglagesTabType);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const newTab = value as ReglagesTabType;
    setActiveTab(newTab);
    
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    setSearchParams(params, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <div className="sticky top-[72px] z-20 bg-background pb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm truncate">Notifs</span>
          </TabsTrigger>
          <TabsTrigger value="synchronisation" className="flex items-center gap-1.5">
            <CalendarSync className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm truncate">Sync</span>
          </TabsTrigger>
          <TabsTrigger value="securite" className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm truncate">Sécurité</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="notifications" className="mt-4">
        {notificationsContent}
      </TabsContent>

      <TabsContent value="synchronisation" className="mt-4">
        {synchronisationContent}
      </TabsContent>

      <TabsContent value="securite" className="mt-4">
        {securiteContent}
      </TabsContent>
    </Tabs>
  );
}
