import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TreatmentWizardActionsProps {
  currentStep: number;
  totalSteps: number;
  loading: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
}

/**
 * Composant responsable des boutons de navigation du wizard
 */
export function TreatmentWizardActions({
  currentStep,
  totalSteps,
  loading,
  onNext,
  onPrev,
  onSubmit,
}: TreatmentWizardActionsProps) {
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    navigate("/treatments");
  };

  return (
    <>
      <div className="flex gap-3 sticky bottom-0 bg-background pt-4 pb-6 border-t">
        {isFirstStep ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={loading}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
        )}
        
        {!isLastStep ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="flex-1 gradient-primary"
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 gradient-primary"
          >
            {loading ? "Enregistrement..." : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Créer le traitement
              </>
            )}
          </Button>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la création ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler ? Toutes les données saisies seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive hover:bg-destructive/90">
              Annuler la création
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
