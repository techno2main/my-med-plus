import { WizardProgress } from "../WizardProgress";
import { Step1Info } from "../Step1Info";
import { Step2Medications } from "../Step2Medications";
import { Step3Stocks } from "../Step3Stocks";
import { Step4Summary } from "../Step4Summary";
import { TreatmentFormData } from "../types";

interface TreatmentWizardStepsProps {
  currentStep: number;
  totalSteps: number;
  formData: TreatmentFormData;
  setFormData: (data: TreatmentFormData) => void;
  prescriptions: any[];
  doctors: any[];
  pharmacies: any[];
  onStepClick: (step: number) => void;
}

/**
 * Composant responsable de l'affichage des étapes du wizard
 */
export function TreatmentWizardSteps({
  currentStep,
  totalSteps,
  formData,
  setFormData,
  prescriptions,
  doctors,
  pharmacies,
  onStepClick,
}: TreatmentWizardStepsProps) {
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Info
            formData={formData}
            setFormData={setFormData}
            prescriptions={prescriptions}
            doctors={doctors}
            pharmacies={pharmacies}
          />
        );
      case 2:
        return (
          <Step2Medications
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          <Step3Stocks
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 4:
        return (
          <Step4Summary
            formData={formData}
            prescriptions={prescriptions}
            pharmacies={pharmacies}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        onStepClick={onStepClick}
      />

      <div className="min-h-[400px]">
        {renderStep()}
      </div>
    </>
  );
}
