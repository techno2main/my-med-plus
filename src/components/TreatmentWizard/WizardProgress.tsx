import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const steps = [
    { number: 1, label: "Informations" },
    { number: 2, label: "Médicaments" },
    { number: 3, label: "Stocks" },
    { number: 4, label: "Récapitulatif" },
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                currentStep > step.number && "bg-primary text-primary-foreground",
                currentStep === step.number && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                currentStep < step.number && "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.number ? (
                <Check className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            <span className={cn(
              "text-xs font-medium hidden sm:block",
              currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
