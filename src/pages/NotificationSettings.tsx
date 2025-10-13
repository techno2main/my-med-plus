import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Clock, AlertTriangle, Calendar, Pill } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { 
    preferences, 
    updatePreferences, 
    isSupported, 
    permission, 
    requestPermission 
  } = useNotifications();

  const handleTogglePush = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }
    updatePreferences({ pushEnabled: enabled });
  };

  const handleTestNotification = () => {
    if (permission !== "granted") {
      toast.error("Veuillez d'abord autoriser les notifications");
      return;
    }
    
    new Notification("💊 Test de notification", {
      body: "Les notifications fonctionnent correctement !",
      icon: "/icon-192.png",
    });
    toast.success("Notification de test envoyée");
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
              Configurez vos rappels et alertes
            </p>
          </div>
          {isSupported && permission === "granted" && (
            <Button variant="outline" size="sm" onClick={handleTestNotification}>
              Tester
            </Button>
          )}
        </div>

        {/* Deployed App Notice */}
        <Card className="p-4 border-primary bg-primary/5">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">ℹ️ Notifications disponibles après déploiement</p>
              <p className="text-sm text-muted-foreground">
                Les notifications push fonctionnent uniquement sur l'application déployée, 
                pas dans l'environnement de prévisualisation. Cliquez sur <strong>Publish</strong> 
                pour déployer votre app et tester les notifications.
              </p>
            </div>
          </div>
        </Card>

        {/* Permission Status */}
        {!isSupported && (
          <Card className="p-4 border-warning bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium">Notifications non supportées</p>
                <p className="text-sm text-muted-foreground">
                  Votre navigateur ne supporte pas les notifications push
                </p>
              </div>
            </div>
          </Card>
        )}

        {isSupported && permission === "default" && (
          <Card className="p-4 border-primary bg-primary/5">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Autoriser les notifications</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Activez les notifications pour recevoir vos rappels
                </p>
                <Button onClick={requestPermission} className="gradient-primary">
                  Autoriser les notifications
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isSupported && permission === "denied" && (
          <Card className="p-4 border-danger bg-danger/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-danger mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Notifications bloquées</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Les notifications ont été bloquées. Pour les réactiver :
                </p>
                <ol className="text-sm text-muted-foreground list-decimal ml-4 space-y-1 mb-3">
                  <li>Cliquez sur l'icône 🔒 ou ⓘ dans la barre d'adresse</li>
                  <li>Cherchez "Notifications" dans les paramètres du site</li>
                  <li>Sélectionnez "Autoriser"</li>
                  <li>Rechargez cette page</li>
                </ol>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="border-danger text-danger hover:bg-danger hover:text-white"
                >
                  Recharger la page
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Global Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Notifications push</p>
                <p className="text-sm text-muted-foreground">
                  Activer tous les rappels
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              onCheckedChange={handleTogglePush}
              disabled={!isSupported || permission === "denied"}
            />
          </div>
        </Card>

        {/* Medication Reminders */}
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Rappels de prise</h3>
              <p className="text-sm text-muted-foreground">
                Notifications pour vos médicaments
              </p>
            </div>
            <Switch
              checked={preferences.medicationReminders}
              onCheckedChange={(checked) =>
                updatePreferences({ medicationReminders: checked })
              }
              disabled={!preferences.pushEnabled}
            />
          </div>

          {preferences.medicationReminders && (
            <div className="pl-11 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="reminder-delay" className="text-sm">
                  Rappel si non pris après
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="reminder-delay"
                    type="number"
                    min="1"
                    max="60"
                    value={preferences.medicationReminderDelay}
                    onChange={(e) =>
                      updatePreferences({
                        medicationReminderDelay: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Un rappel sera envoyé si vous n'avez pas marqué la prise dans ce délai
              </p>
            </div>
          )}
        </Card>

        {/* Stock Alerts */}
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Alertes de stock</h3>
              <p className="text-sm text-muted-foreground">
                Quand le stock est bas
              </p>
            </div>
            <Switch
              checked={preferences.stockAlerts}
              onCheckedChange={(checked) =>
                updatePreferences({ stockAlerts: checked })
              }
              disabled={!preferences.pushEnabled}
            />
          </div>

          {preferences.stockAlerts && (
            <div className="pl-11">
              <p className="text-xs text-muted-foreground">
                Notification envoyée lorsque le stock atteint le seuil d'alerte configuré
              </p>
            </div>
          )}
        </Card>

        {/* Prescription Renewal */}
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Renouvellement d'ordonnances</h3>
              <p className="text-sm text-muted-foreground">
                Avant l'expiration
              </p>
            </div>
            <Switch
              checked={preferences.prescriptionRenewal}
              onCheckedChange={(checked) =>
                updatePreferences({ prescriptionRenewal: checked })
              }
              disabled={!preferences.pushEnabled}
            />
          </div>

          {preferences.prescriptionRenewal && (
            <div className="pl-11 space-y-3">
              <div className="flex flex-wrap gap-2">
                {preferences.prescriptionRenewalDays.map((days, index) => (
                  <Badge key={index} variant="secondary">
                    J-{days}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Rappels à J-10 et J-2 avant l'échéance de votre ordonnance
              </p>
            </div>
          )}
        </Card>

        {/* Pharmacy Visit Reminder */}
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Rappels visite pharmacie</h3>
              <p className="text-sm text-muted-foreground">
                Avant chaque renouvellement
              </p>
            </div>
            <Switch
              checked={preferences.pharmacyVisitReminder}
              onCheckedChange={(checked) =>
                updatePreferences({ pharmacyVisitReminder: checked })
              }
              disabled={!preferences.pushEnabled}
            />
          </div>

          {preferences.pharmacyVisitReminder && (
            <div className="pl-11 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="pharmacy-days" className="text-sm">
                  Rappel avant visite
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pharmacy-days"
                    type="number"
                    min="0"
                    max="7"
                    value={preferences.pharmacyVisitReminderDays}
                    onChange={(e) =>
                      updatePreferences({
                        pharmacyVisitReminderDays: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">jour(s)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Notification envoyée la veille de votre visite à la pharmacie
              </p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
