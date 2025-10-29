import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { usePrescriptions } from "./hooks/usePrescriptions";
import { PrescriptionList } from "./components/PrescriptionList";
import { RefillConfirmDialog } from "./components/RefillConfirmDialog";
import { getLocalDateString } from "@/lib/dateUtils";

interface PendingVisitAction {
  treatmentId: string;
  visitNumber: number;
  currentStatus: boolean;
  plannedDate: string;
}

export default function Prescriptions() {
  const { prescriptions, loading, handleToggleVisit, handleDownload } = usePrescriptions();
  const [pendingAction, setPendingAction] = useState<PendingVisitAction | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  const handleVisitClick = (
    treatmentId: string,
    visitNumber: number,
    currentStatus: boolean,
    plannedDate: string
  ) => {
    const today = getLocalDateString(new Date());
    const planned = getLocalDateString(new Date(plannedDate));
    
    // Si on essaie de cocher et qu'on n'est pas à la date prévue
    if (!currentStatus && today < planned) {
      setPendingAction({ treatmentId, visitNumber, currentStatus, plannedDate: planned });
      setShowDialog(true);
      return;
    }
    
    // Si on essaie de décocher et qu'on n'est pas à la date prévue
    if (currentStatus && today !== planned) {
      setPendingAction({ treatmentId, visitNumber, currentStatus, plannedDate: planned });
      setShowDialog(true);
      return;
    }
    
    // Sinon, exécuter directement
    handleToggleVisit(treatmentId, visitNumber, currentStatus);
  };
  
  const handleConfirm = () => {
    if (pendingAction) {
      handleToggleVisit(
        pendingAction.treatmentId,
        pendingAction.visitNumber,
        pendingAction.currentStatus
      );
    }
    setShowDialog(false);
    setPendingAction(null);
  };
  
  const getDialogContent = () => {
    if (!pendingAction) return { title: "", description: "" };
    
    const today = getLocalDateString(new Date());
    const isEarly = !pendingAction.currentStatus; // On coche avant la date
    
    if (isEarly) {
      return {
        title: "Rechargement anticipé",
        description: `Vous êtes en avance par rapport à la date prévue (${new Date(pendingAction.plannedDate).toLocaleDateString("fr-FR")}). Voulez-vous quand même valider ce rechargement ?`,
        confirmText: "Valider quand même",
      };
    } else {
      return {
        title: "Annulation du rechargement",
        description: `Attention : ce rechargement n'a pas été effectué à la date prévue (${new Date(pendingAction.plannedDate).toLocaleDateString("fr-FR")}). Voulez-vous quand même l'annuler ?`,
        confirmText: "Annuler quand même",
        isWarning: true,
      };
    }
  };
  
  const dialogContent = getDialogContent();

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader title="Ordonnances" subtitle="Vos prescriptions médicales" />

        <PrescriptionList
          prescriptions={prescriptions}
          loading={loading}
          onDownload={handleDownload}
          onToggleVisit={handleVisitClick}
        />
        
        <RefillConfirmDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onConfirm={handleConfirm}
          title={dialogContent.title}
          description={dialogContent.description}
          confirmText={dialogContent.confirmText}
          isWarning={dialogContent.isWarning}
        />
      </div>
    </AppLayout>
  );
}
