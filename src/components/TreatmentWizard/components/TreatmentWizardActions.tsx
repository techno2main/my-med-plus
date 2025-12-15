import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

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
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex gap-3 sticky bottom-0 bg-background pt-4 pb-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onPrev}
        disabled={isFirstStep || loading}
        className="flex-1"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Précédent
      </Button>
      
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
  );
}
