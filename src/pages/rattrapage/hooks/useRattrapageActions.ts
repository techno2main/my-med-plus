import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { IntakeAction, ConfirmationDialog } from "../utils/rattrapageTypes";

interface MissedIntake {
  id: string;
  medication: string;
  dosage?: string;
  displayTime: string;
  scheduledTime: string;
  dayName: string;
  status: string;
  medicationId: string;
}

export function useRattrapageActions(missedIntakes: MissedIntake[]) {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Record<string, IntakeAction>>({});
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    intakeId: '',
    action: 'pending',
    medicationName: '',
    scheduledTime: '',
    dayName: '',
  });
  const [saving, setSaving] = useState(false);

  // Initialiser les actions
  useEffect(() => {
    const initialActions: Record<string, IntakeAction> = {};
    missedIntakes.forEach(intake => {
      initialActions[intake.id] = {
        id: intake.id,
        action: 'pending',
      };
    });
    setActions(initialActions);
  }, [missedIntakes]);

  const openConfirmDialog = (
    intakeId: string,
    action: 'taken' | 'taken_now' | 'skipped'
  ) => {
    const intake = missedIntakes.find(i => i.id === intakeId);
    if (!intake) return;

    setConfirmDialog({
      isOpen: true,
      intakeId,
      action,
      medicationName: intake.medication,
      scheduledTime: intake.scheduledTime,
      dayName: intake.dayName,
    });
  };

  const confirmAction = () => {
    const { intakeId, action } = confirmDialog;
    
    setActions(prev => ({
      ...prev,
      [intakeId]: {
        id: intakeId,
        action,
        takenAt: action === 'taken' 
          ? confirmDialog.scheduledTime 
          : action === 'taken_now' 
          ? new Date().toISOString() 
          : undefined,
        scheduledTime: confirmDialog.scheduledTime,
      },
    }));

    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancelAll = () => {
    const resetActions: Record<string, IntakeAction> = {};
    Object.keys(actions).forEach(id => {
      resetActions[id] = {
        id,
        action: 'pending',
      };
    });
    setActions(resetActions);
    toast.info("Toutes les actions ont été annulées");
  };

  const handleSaveAll = async () => {
    setSaving(true);
    
    try {
      // Filtrer les actions traitées
      const processedActions = Object.values(actions).filter(
        a => a.action !== 'pending'
      );

      if (processedActions.length === 0) {
        toast.error("Aucune action à sauvegarder");
        setSaving(false);
        return;
      }

      let takenCount = 0;
      let skippedCount = 0;

      // Traiter chaque action
      for (const actionItem of processedActions) {
        const intake = missedIntakes.find(i => i.id === actionItem.id);
        if (!intake) continue;

        const updateData: any = {
          status: actionItem.action === 'skipped' ? 'skipped' : 'taken',
        };

        // Ajouter taken_at si pris
        if (actionItem.action === 'taken' || actionItem.action === 'taken_now') {
          updateData.taken_at = actionItem.takenAt;
          takenCount++;
        } else {
          skippedCount++;
        }

        // Ajouter une note
        if (actionItem.action === 'taken') {
          updateData.notes = "Pris à l'heure prévue (marqué en retard)";
        } else if (actionItem.action === 'taken_now') {
          updateData.notes = "Pris en rattrapage";
        }

        // Mettre à jour la prise
        const { error: updateError } = await supabase
          .from('medication_intakes')
          .update(updateData)
          .eq('id', actionItem.id);

        if (updateError) throw updateError;

        // Décrémenter le stock si pris
        if (actionItem.action === 'taken' || actionItem.action === 'taken_now') {
          const { data: medication, error: fetchError } = await supabase
            .from('medications')
            .select('current_stock')
            .eq('id', intake.medicationId)
            .single();

          if (!fetchError && medication) {
            const newStock = Math.max(0, (medication.current_stock || 0) - 1);
            
            const { error: stockError } = await supabase
              .from('medications')
              .update({ current_stock: newStock })
              .eq('id', intake.medicationId);

            if (stockError) throw stockError;
          }
        }
      }

      toast.success(
        `${processedActions.length} prise(s) traitée(s) : ${takenCount} prise(s), ${skippedCount} manquée(s)`
      );
      
      navigate("/admin");
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = Object.values(actions).filter(a => a.action === 'pending').length;
  const processedCount = Object.values(actions).filter(a => a.action !== 'pending').length;

  return {
    actions,
    confirmDialog,
    saving,
    openConfirmDialog,
    confirmAction,
    handleCancelAll,
    handleSaveAll,
    pendingCount,
    processedCount,
    closeDialog: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
  };
}
