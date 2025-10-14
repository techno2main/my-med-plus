import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Clock, AlertTriangle, Calendar, Pill, Settings2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { 
    preferences, 
    updatePreferences, 
    isSupported, 
    permission, 
    requestPermission,
    sendTestNotification 
  } = useNotifications();
  const [showCustomize, setShowCustomize] = useState(false);

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
    
    const success = sendTestNotification();
    if (success) {
      toast.success("Notification de test envoyée ✓");
    } else {
      toast.error("Erreur lors de l'envoi de la notification");
    }
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
                <p className="font-medium">Activer les notifications</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Cliquez pour autoriser les notifications et recevoir vos rappels
                </p>
                <Button onClick={requestPermission} className="gradient-primary">
                  Activer les notifications
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isSupported && permission === "granted" && (
          <Card className="p-4 border-success bg-success/5">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-success mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">✓ Notifications activées</p>
                <p className="text-sm text-muted-foreground">
                  Vous recevrez vos rappels selon vos préférences
                </p>
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
            <div className="pl-11 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="reminder-before" className="text-sm">
                    Alerte avant la prise
                  </Label>
                  <div className="flex items-center gap-2">
                    <NumberInput
                      id="reminder-before"
                      min={1}
                      max={60}
                      value={preferences.medicationReminderBefore}
                      onChange={(value) =>
                        updatePreferences({ medicationReminderBefore: value })
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Notification envoyée avant l'heure de prise prévue
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="reminder-delay" className="text-sm">
                    Rappel si non pris après
                  </Label>
                  <div className="flex items-center gap-2">
                    <NumberInput
                      id="reminder-delay"
                      min={1}
                      max={60}
                      value={preferences.medicationReminderDelay}
                      onChange={(value) =>
                        updatePreferences({ medicationReminderDelay: value })
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rappel envoyé si vous n'avez pas marqué la prise dans ce délai
                </p>
              </div>
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
                  <NumberInput
                    id="pharmacy-days"
                    min={0}
                    max={7}
                    value={preferences.pharmacyVisitReminderDays}
                    onChange={(value) =>
                      updatePreferences({ pharmacyVisitReminderDays: value })
                    }
                    className="w-20"
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

        {/* Customize Messages */}
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Personnaliser les messages</h3>
              <p className="text-sm text-muted-foreground">
                Modifiez les titres des notifications
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomize(!showCustomize)}
            >
              {showCustomize ? "Masquer" : "Modifier"}
            </Button>
          </div>

          {showCustomize && (
            <div className="pl-11 space-y-3">
              <div>
                <Label htmlFor="msg-medication" className="text-xs">
                  Rappel de prise
                </Label>
                <Input
                  id="msg-medication"
                  value={preferences.customMessages.medicationReminder}
                  onChange={(e) =>
                    updatePreferences({
                      customMessages: {
                        ...preferences.customMessages,
                        medicationReminder: e.target.value,
                      },
                    })
                  }
                  placeholder="💊 Rappel de prise"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="msg-delayed" className="text-xs">
                  Rappel de prise manquée
                </Label>
                <Input
                  id="msg-delayed"
                  value={preferences.customMessages.delayedReminder}
                  onChange={(e) =>
                    updatePreferences({
                      customMessages: {
                        ...preferences.customMessages,
                        delayedReminder: e.target.value,
                      },
                    })
                  }
                  placeholder="⏰ Rappel de prise manquée"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="msg-stock" className="text-xs">
                  Alerte de stock
                </Label>
                <Input
                  id="msg-stock"
                  value={preferences.customMessages.stockAlert}
                  onChange={(e) =>
                    updatePreferences({
                      customMessages: {
                        ...preferences.customMessages,
                        stockAlert: e.target.value,
                      },
                    })
                  }
                  placeholder="⚠️ Stock faible"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="msg-renewal" className="text-xs">
                  Renouvellement d'ordonnance
                </Label>
                <Input
                  id="msg-renewal"
                  value={preferences.customMessages.prescriptionRenewal}
                  onChange={(e) =>
                    updatePreferences({
                      customMessages: {
                        ...preferences.customMessages,
                        prescriptionRenewal: e.target.value,
                      },
                    })
                  }
                  placeholder="📅 Renouvellement d'ordonnance"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="msg-pharmacy" className="text-xs">
                  Visite pharmacie
                </Label>
                <Input
                  id="msg-pharmacy"
                  value={preferences.customMessages.pharmacyVisit}
                  onChange={(e) =>
                    updatePreferences({
                      customMessages: {
                        ...preferences.customMessages,
                        pharmacyVisit: e.target.value,
                      },
                    })
                  }
                  placeholder="💊 Visite pharmacie"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
