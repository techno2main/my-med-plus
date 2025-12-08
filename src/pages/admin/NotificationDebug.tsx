import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { Badge } from "@/components/ui/badge";
import { useMedicationNotificationScheduler } from "@/hooks/useMedicationNotificationScheduler";

interface PendingNotification {
  id: number;
  title: string;
  body: string;
  schedule?: any;
}

interface MedicationIntake {
  id: string;
  scheduled_time: string;
  status: string;
  medications: {
    name: string;
    treatment_id: string;
    treatments: {
      user_id: string;
      is_active: boolean;
    };
  };
}

export default function NotificationDebug() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingNotification[]>([]);
  const [intakes, setIntakes] = useState<MedicationIntake[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [cache, setCache] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { rescheduleAll } = useMedicationNotificationScheduler();

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      // 1. Notifications Android en attente
      if (Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.getPending();
        setPending(result.notifications);
        console.log("📱 Notifications en attente:", result.notifications);
      }

      // 2. Prises BDD
      const { data: user, error } = await getAuthenticatedUser();
      if (error || !user) {
        console.warn('[NotificationDebug] Utilisateur non authentifié:', error?.message);
        setLoading(false);
        return;
      }
      
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          scheduled_time,
          status,
          medications (
            name,
            treatment_id,
            treatments (
              user_id,
              is_active
            )
          )
        `)
        .eq("status", "pending")
        .gte("scheduled_time", now.toISOString())
        .lte("scheduled_time", next24h.toISOString())
        .order("scheduled_time", { ascending: true });

      const userIntakes = data?.filter((intake: any) => {
        const treatment = intake.medications?.treatments;
        if (!treatment || treatment.user_id !== user.id) return false;
        
        // Filtrer uniquement les traitements actifs
        return treatment.is_active === true;
      }) || [];
      
      setIntakes(userIntakes);
      console.log("💊 Prises BDD:", userIntakes);

      // 3. Préférences localStorage
      const saved = localStorage.getItem("notificationPreferences");
      if (saved) {
        setPreferences(JSON.parse(saved));
      }

      // 4. Cache localStorage
      const savedCache = localStorage.getItem('scheduled_notifications_cache');
      if (savedCache) {
        setCache(JSON.parse(savedCache));
      }

    } catch (error) {
      console.error("Erreur chargement debug:", error);
      toast.error(`Erreur: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatScheduleTime = (schedule: any) => {
    if (schedule?.at) {
      const date = new Date(schedule.at);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    return JSON.stringify(schedule);
  };

  const clearCache = () => {
    localStorage.removeItem('scheduled_notifications_cache');
    setCache([]);
    toast.success("Cache vidé");
  };

  const cancelAll = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const result = await LocalNotifications.getPending();
      await LocalNotifications.cancel(result);
      toast.success("Toutes les notifications annulées");
      loadDebugInfo();
    } catch (error) {
      toast.error(`Erreur: ${error}`);
    }
  };

  const triggerRescheduleWithToasts = async () => {
    setLoading(true);
    try {
      // Appel avec true pour afficher les toasts
      await rescheduleAll(true);
      // Recharger les infos après la replanification
      setTimeout(() => {
        loadDebugInfo();
      }, 1000);
    } catch (error) {
      console.error("Erreur replanification:", error);
      toast.error(`Erreur: ${error}`);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold">🔍 Debug Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Diagnostic complet du système
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadDebugInfo} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Actions rapides */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">⚡ Actions rapides</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={triggerRescheduleWithToasts}
              disabled={loading}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              Replanifier avec toasts
            </Button>
            <Button variant="outline" size="sm" onClick={clearCache}>
              Vider le cache
            </Button>
            <Button variant="destructive" size="sm" onClick={cancelAll}>
              Annuler toutes les notifs
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 Le bouton "Replanifier avec toasts" permet de tester la replanification 
            complète avec affichage des toasts (désactivés au démarrage normal de l'app).
          </p>
        </Card>

        {/* Préférences */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">⚙️ Préférences (localStorage)</h3>
          {preferences ? (
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span>Push activé:</span>
                <Badge variant={preferences.pushEnabled ? "default" : "secondary"}>
                  {preferences.pushEnabled ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Rappels médocs:</span>
                <Badge variant={preferences.medicationReminders ? "default" : "secondary"}>
                  {preferences.medicationReminders ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Avant la prise:</span>
                <Badge>{preferences.medicationReminderBefore} min</Badge>
              </div>
              <div className="flex justify-between">
                <span>Après la prise:</span>
                <Badge>{preferences.medicationReminderDelay} min</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucune préférence trouvée</p>
          )}
        </Card>

        {/* Cache */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">💾 Cache ({cache.length})</h3>
          {cache.length > 0 ? (
            <div className="space-y-1 text-xs font-mono max-h-40 overflow-y-auto">
              {cache.map((key, index) => (
                <div key={index} className="p-1 bg-muted rounded">
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Cache vide</p>
          )}
        </Card>

        {/* Prises BDD */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">💊 Prises BDD prochaines 24h ({intakes.length})</h3>
          {intakes.length > 0 ? (
            <div className="space-y-2">
              {intakes.map((intake) => (
                <div key={intake.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{intake.medications?.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">ID: {intake.id}</p>
                    </div>
                    <Badge>{intake.status}</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">Heure prévue:</span>{" "}
                      <span className="font-semibold">{formatDate(intake.scheduled_time)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      <span>ISO:</span> {intake.scheduled_time}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      <span>Timestamp:</span> {new Date(intake.scheduled_time).getTime()}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      <span>new Date():</span> {new Date(intake.scheduled_time).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aucune prise trouvée</p>
          )}
        </Card>

        {/* Notifications Android en attente */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">📱 Notifications Android planifiées ({pending.length})</h3>
          {pending.length > 0 ? (
            <div className="space-y-2">
              {pending.map((notif) => (
                <div key={notif.id} className="p-3 border rounded-lg bg-primary/5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.body}</p>
                    </div>
                    <Badge variant="outline" className="font-mono">ID: {notif.id}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>Prévue:</span>{" "}
                    <span className="font-semibold">{formatScheduleTime(notif.schedule)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">⚠️</p>
              <p className="font-semibold text-warning">Aucune notification planifiée !</p>
              <p className="text-sm text-muted-foreground mt-1">
                C'est ici qu'on voit le problème...
              </p>
            </div>
          )}
        </Card>

        {/* Analyse */}
        <Card className="p-4 border-warning bg-warning/5">
          <h3 className="font-semibold mb-3">🔬 Analyse</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className={intakes.length > 0 ? "text-success" : "text-destructive"}>
                {intakes.length > 0 ? "✓" : "✗"}
              </span>
              <span>
                {intakes.length} prise(s) trouvée(s) dans la BDD
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className={pending.length > 0 ? "text-success" : "text-destructive"}>
                {pending.length > 0 ? "✓" : "✗"}
              </span>
              <span>
                {pending.length} notification(s) planifiée(s) dans Android
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className={preferences?.medicationReminders ? "text-success" : "text-destructive"}>
                {preferences?.medicationReminders ? "✓" : "✗"}
              </span>
              <span>
                Rappels de médicaments activés
              </span>
            </div>
            {intakes.length > 0 && pending.length === 0 && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="font-semibold text-destructive">❌ PROBLÈME DÉTECTÉ</p>
                <p className="text-sm mt-1">
                  Il y a {intakes.length} prise(s) en BDD mais AUCUNE notification Android planifiée !
                  <br />La planification ne fonctionne pas correctement.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
