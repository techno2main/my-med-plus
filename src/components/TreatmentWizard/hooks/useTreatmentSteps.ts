import { useState, useCallback } from "react";

const TOTAL_STEPS = 4;

interface UseTreatmentStepsReturn {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  handleNext: () => void;
  handlePrev: () => void;
  setCurrentStep: (step: number) => void;
}

/**
 * Hook personnalisé pour gérer la navigation entre les étapes du wizard
 */
export const useTreatmentSteps = (): UseTreatmentStepsReturn => {
  const [currentStep, setCurrentStep] = useState(1);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrev,
    setCurrentStep,
  };
};
