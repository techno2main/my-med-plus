import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, CheckCircle2, XCircle, ArrowLeft, Save, Pill } from "lucide-react";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMissedIntakesDetection } from "@/hooks/useMissedIntakesDetection";
import { convertFrenchToUTC } from "../lib/dateUtils";

interface IntakeAction {
  id: string;
  action: 'taken' | 'skipped' | 'taken_now' | 'pending';
  takenAt?: Date;
  scheduledTime?: Date;
}

interface ConfirmationDialog {
  isOpen: boolean;
  intakeId: string;
  action: 'taken' | 'skipped' | 'taken_now';
  medicationName: string;
  scheduledTime: string;
  dayName: string;
}

export default function Rattrapage() {
  const navigate = useNavigate();
  const { missedIntakes, totalMissed, loading } = useMissedIntakesDetection();
  const [actions, setActions] = useState<Record<string, IntakeAction>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    intakeId: '',
    action: 'taken',
    medicationName: '',
    scheduledTime: '',
    dayName: ''
  });

  // Initialiser les actions avec l'état pending
  useEffect(() => {
    if (missedIntakes.length > 0) {
      setActions(prevActions => {
        const initialActions: Record<string, IntakeAction> = {};
        missedIntakes.forEach(intake => {
          // Conserver l'action existante si elle existe, sinon initialiser à pending
          initialActions[intake.id] = prevActions[intake.id] || {
            id: intake.id,
            action: 'pending'
          };
        });
        return initialActions;
      });
    }
  }, [missedIntakes]);

  const openConfirmDialog = (intakeId: string, action: 'taken' | 'skipped' | 'taken_now') => {
    const intake = missedIntakes.find(i => i.id === intakeId);
    if (!intake) return;

    setConfirmDialog({
      isOpen: true,
      intakeId,
      action,
      medicationName: intake.medication,
      scheduledTime: intake.displayTime,
      dayName: intake.dayName
    });
  };

  const confirmAction = () => {
    const { intakeId, action } = confirmDialog;
    const intake = missedIntakes.find(i => i.id === intakeId);
    if (!intake) return;

    const scheduledTime = new Date(intake.scheduledTime);
    const now = new Date();

    setActions(prev => ({
      ...prev,
      [intakeId]: {
        id: intakeId,
        action: action,
        takenAt: action === 'taken_now' ? now : (action === 'taken' ? scheduledTime : undefined),
        scheduledTime: scheduledTime
      }
    }));

    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancelAll = () => {
    // Remettre toutes les actions en pending
    const resetActions: Record<string, IntakeAction> = {};
    missedIntakes.forEach(intake => {
      resetActions[intake.id] = {
        id: intake.id,
        action: 'pending'
      };
    });
    setActions(resetActions);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Filtrer seulement les actions traitées (pas pending)
      const processedActions = Object.values(actions).filter(
        action => action.action !== 'pending'
      );

      if (processedActions.length === 0) {
        toast.error("Aucune action à sauvegarder");
        return;
      }

      // CORRECTION : UPDATE au lieu d'INSERT pour éviter les doublons
      // Les entrées existent déjà dans medication_intakes avec status='pending'
      for (const action of processedActions) {
        const intake = missedIntakes.find(i => i.id === action.id);
        if (!intake) continue;

        let taken_at = null;
        let status = action.action;
        let notes = '';

        switch (action.action) {
          case 'taken':
            // Pris à l'heure prévue initialement
            taken_at = intake.scheduledTime;
            status = 'taken';
            notes = 'Rattrapage - Marqué comme pris à l\'heure prévue';
            break;
          case 'taken_now':
            // Pris maintenant (heure actuelle réelle)
            taken_at = convertFrenchToUTC(action.takenAt || new Date()).toISOString();
            status = 'taken';
            notes = 'Rattrapage - Pris avec retard';
            break;
          case 'skipped':
            // Manqué/oublié
            taken_at = null;
            status = 'skipped';
            notes = 'Rattrapage - Marqué comme manqué';
            break;
        }

        // UPDATE de l'entrée existante au lieu d'INSERT
        const { error } = await supabase
          .from('medication_intakes')
          .update({
            taken_at: taken_at,
            status: status,
            notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', intake.id);

        if (error) {
          console.error(`Erreur UPDATE intake ${intake.id}:`, error);
          throw error;
        }
      }

      // Mettre à jour le stock pour les prises marquées comme prises
      const takenActions = processedActions.filter(action => action.action === 'taken' || action.action === 'taken_now');

      for (const action of takenActions) {
        const intake = missedIntakes.find(i => i.id === action.id);
        if (intake) {
          // Décrémenter le stock
          const { data: currentMed, error: fetchError } = await supabase
            .from("medications")
            .select("current_stock")
            .eq("id", intake.medicationId)
            .single();

          if (!fetchError && currentMed) {
            const { error: updateError } = await supabase
              .from("medications")
              .update({
                current_stock: Math.max(0, currentMed.current_stock - 1)
              })
              .eq("id", intake.medicationId);

            if (updateError) {
              console.error("Erreur mise à jour stock:", updateError);
            }
          }
        }
      }

      const processedCount = processedActions.length;
      const takenCount = takenActions.length;
      const skippedCount = processedActions.filter(a => a.action === 'skipped').length;

      toast.success(
        `${processedCount} prise${processedCount > 1 ? 's' : ''} traitée${processedCount > 1 ? 's' : ''} ` +
        `(${takenCount} prise${takenCount > 1 ? 's' : ''}, ${skippedCount} oubliée${skippedCount > 1 ? 's' : ''})`
      );

      // Retourner à l'accueil
      navigate("/");

    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde des rattrapages");
    } finally {
      setSaving(false);
    }
  };

  const getActionIcon = (action: 'taken' | 'skipped' | 'taken_now' | 'pending') => {
    switch (action) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'taken_now':
        return <Pill className="h-4 w-4 text-primary" />;
      case 'skipped':
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getActionLabel = (action: 'taken' | 'skipped' | 'taken_now' | 'pending') => {
    switch (action) {
      case 'taken':
        return 'Prêt';
      case 'taken_now':
        return 'Prêt';
      case 'skipped':
        return 'Prêt';
      default:
        return 'À traiter';
    }
  };

  const pendingCount = Object.values(actions).filter(a => a.action === 'pending').length;
  const processedCount = Object.values(actions).filter(a => a.action !== 'pending').length;

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Rattrapage des prises"
          subtitle={totalMissed === 0 
            ? "Aucune prise à rattraper" 
            : `${totalMissed} prise${totalMissed > 1 ? 's' : ''} à traiter`
          }
          backTo="/"
        />

        {totalMissed === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Tout est à jour !</h3>
            <p className="text-muted-foreground mb-4">
              Aucune prise manquée détectée
            </p>
            <Button onClick={() => navigate("/")}>
              Retour à l'accueil
            </Button>
          </Card>
        ) : (
          <>
            {/* Résumé des actions */}
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-medium">
                    {processedCount}/{totalMissed} prises traitées
                  </span>
                  <span className="text-muted-foreground">
                    {pendingCount} en attente de traitement
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAll}
                    disabled={saving}
                    className="gap-1 text-xs"
                  >
                    <XCircle className="h-3 w-3" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={processedCount !== totalMissed || saving}
                    className="gap-1 text-xs"
                  >
                    <Save className="h-3 w-3" />
                    {saving ? "Validation..." : "Valider"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Liste des prises à traiter */}
            <div className="space-y-4">
              {missedIntakes.map((intake) => {
                const currentAction = actions[intake.id];
                const isToday = intake.status === 'missed_today';
                
                return (
                  <Card key={intake.id} className="p-4">
                    <div className="space-y-3">
                      {/* En-tête avec date et statut */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={isToday ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {intake.dayName}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(intake.scheduledTime), "dd/MM/yyyy", { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getActionIcon(currentAction?.action || 'pending')}
                          <span className="text-sm font-medium">
                            {getActionLabel(currentAction?.action || 'pending')}
                          </span>
                        </div>
                      </div>

                      {/* Informations du médicament */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{intake.medication}</span>
                          {intake.dosage && (
                            <span className="text-sm text-muted-foreground">
                              {intake.dosage}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          Prévu à {intake.displayTime}
                        </p>
                      </div>

                      {/* Actions */}
                      <TooltipProvider>
                        <div className="flex gap-2 pt-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openConfirmDialog(intake.id, 'taken')}
                                className={`flex-1 gap-1 ${
                                  currentAction?.action === 'taken' 
                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                                    : ''
                                }`}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Pris
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>J'ai pris le médicament à l'heure prévue mais j'ai oublié de cliquer sur le bouton</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openConfirmDialog(intake.id, 'taken_now')}
                                className={`flex-1 gap-1 ${
                                  currentAction?.action === 'taken_now' 
                                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' 
                                    : ''
                                }`}
                              >
                                <Pill className="h-3 w-3" />
                                Prendre
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Je prends le médicament maintenant (heure actuelle réelle)</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant={currentAction?.action === 'skipped' ? "destructive" : "outline"}
                                onClick={() => openConfirmDialog(intake.id, 'skipped')}
                                className={`flex-1 gap-1 ${
                                  currentAction?.action === 'skipped' 
                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                                    : ''
                                }`}
                              >
                                <XCircle className="h-3 w-3" />
                                Manqué
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Je n'ai pas pris le médicament et il est trop tard pour le prendre</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Dialog de confirmation */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => 
        setConfirmDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'action</DialogTitle>
            <DialogDescription>
              {confirmDialog.medicationName} - Prévu {confirmDialog.dayName.toLowerCase()} à {confirmDialog.scheduledTime}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm">
              {confirmDialog.action === 'taken' && 
                "Confirmer que vous avez pris ce médicament à l'heure prévue mais avez oublié de cliquer sur le bouton ?"
              }
              {confirmDialog.action === 'taken_now' && 
                "Confirmer que vous voulez prendre ce médicament maintenant (heure actuelle réelle) ?"
              }
              {confirmDialog.action === 'skipped' && 
                "Confirmer que vous n'avez pas pris ce médicament et qu'il est trop tard pour le prendre ?"
              }
            </p>
          </div>

          <DialogFooter className="flex flex-row justify-between gap-2">
            <Button variant="outline" onClick={() => 
              setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            }>
              Annuler
            </Button>
            <Button onClick={confirmAction}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}