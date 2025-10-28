import { AppLayout } from "@/components/Layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNotificationSystem } from "@/hooks/useNotificationSystem";
import { PermissionBanners } from "./components/PermissionBanners";
import { GlobalToggleCard } from "./components/GlobalToggleCard";
import { MedicationRemindersCard } from "./components/MedicationRemindersCard";
import { StockAlertsCard } from "./components/StockAlertsCard";
import { PrescriptionRenewalCard } from "./components/PrescriptionRenewalCard";
import { PharmacyVisitCard } from "./components/PharmacyVisitCard";
import { CustomMessagesCard } from "./components/CustomMessagesCard";
import { toast } from "sonner";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { 
    preferences, 
    updatePreferences, 
    isSupported, 
    permission, 
    hasPermission,
    requestPermission,
    sendTestNotification,
    mode
  } = useNotificationSystem();

  const handleTogglePush = async (enabled: boolean) => {
    const permissionGranted = mode === 'native' ? hasPermission : permission === "granted";
    if (enabled && !permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    updatePreferences({ pushEnabled: enabled });
  };

  const handleTestNotification = async () => {
    const permissionGranted = mode === 'native' ? hasPermission : permission === "granted";
    if (!permissionGranted) {
      toast.error("Veuillez d'abord autoriser les notifications");
      return;
    }
    
    await sendTestNotification();
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Configurer rappels et alertes
            </p>
          </div>
          <div className="flex gap-2">
            {isSupported && (mode === 'native' ? hasPermission : permission === "granted") && (
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                Tester
              </Button>
            )}
          </div>
        </div>

        <PermissionBanners
          isSupported={isSupported}
          hasPermission={hasPermission}
          permission={permission}
          mode={mode}
          onRequestPermission={requestPermission}
        />

        <GlobalToggleCard
          pushEnabled={preferences.pushEnabled}
          isSupported={isSupported}
          permission={permission}
          onToggle={handleTogglePush}
        />

        <MedicationRemindersCard
          enabled={preferences.medicationReminders}
          reminderBefore={preferences.medicationReminderBefore}
          reminderDelay={preferences.medicationReminderDelay}
          pushEnabled={preferences.pushEnabled}
          onToggle={(checked) => updatePreferences({ medicationReminders: checked })}
          onReminderBeforeChange={(value) => updatePreferences({ medicationReminderBefore: value })}
          onReminderDelayChange={(value) => updatePreferences({ medicationReminderDelay: value })}
        />

        <StockAlertsCard
          enabled={preferences.stockAlerts}
          pushEnabled={preferences.pushEnabled}
          onToggle={(checked) => updatePreferences({ stockAlerts: checked })}
        />

        <PrescriptionRenewalCard
          enabled={preferences.prescriptionRenewal}
          renewalDays={preferences.prescriptionRenewalDays}
          pushEnabled={preferences.pushEnabled}
          onToggle={(checked) => updatePreferences({ prescriptionRenewal: checked })}
        />

        <PharmacyVisitCard
          enabled={preferences.pharmacyVisitReminder}
          reminderDays={preferences.pharmacyVisitReminderDays}
          pushEnabled={preferences.pushEnabled}
          onToggle={(checked) => updatePreferences({ pharmacyVisitReminder: checked })}
          onReminderDaysChange={(value) => updatePreferences({ pharmacyVisitReminderDays: value })}
        />

        <CustomMessagesCard
          customMessages={preferences.customMessages}
          onUpdate={(messages) => updatePreferences({ customMessages: messages })}
        />
      </div>
    </AppLayout>
  );
}
