import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { PersonnalisationTabs } from "./components/PersonnalisationTabs";
import { ThemeContent } from "./components/ThemeContent";
import { NavigationManagerContent } from "@/pages/admin/NavigationManagerContent";

export default function Personnalisation() {
  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <PageHeader 
            title="Personnalisation"
            subtitle="Apparence et menus"
            backTo="/settings"
          />
        </div>
        
        <div className="mt-4">
          <PersonnalisationTabs
            apparenceContent={<ThemeContent />}
            menusContent={<NavigationManagerContent />}
          />
        </div>
      </div>
    </AppLayout>
  );
}
