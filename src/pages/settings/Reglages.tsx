import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { ReglagesTabs } from "./components/ReglagesTabs";
import { NotificationSettingsContent } from "@/pages/notification-settings/NotificationSettingsContent";
import { CalendarSyncContent } from "@/pages/calendar-sync/CalendarSyncContent";
import { PrivacyContent } from "@/pages/privacy/PrivacyContent";

export default function Reglages() {
  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <PageHeader 
            title="Réglages"
            subtitle="Configuration de l'application"
            backTo="/settings"
          />
        </div>
        
        <div className="mt-4">
          <ReglagesTabs
            notificationsContent={<NotificationSettingsContent />}
            synchronisationContent={<CalendarSyncContent />}
            securiteContent={<PrivacyContent />}
          />
        </div>
      </div>
    </AppLayout>
  );
}
