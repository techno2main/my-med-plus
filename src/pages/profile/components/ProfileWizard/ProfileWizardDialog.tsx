import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { User, Calendar, Droplets, Ruler, Scale, ArrowRight, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | undefined;
  bloodType: string;
  height: string;
  weight: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onDateOfBirthChange: (date: Date | undefined) => void;
  onBloodTypeChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onComplete: () => void;
  onSkip?: () => void;
}

type WizardStep = 'intro' | 'firstName' | 'lastName' | 'dateOfBirth' | 'bloodType' | 'height' | 'weight' | 'complete';

const STEPS: WizardStep[] = ['firstName', 'lastName', 'dateOfBirth', 'bloodType', 'height', 'weight'];

export function ProfileWizardDialog({
  open,
  onOpenChange,
  firstName,
  lastName,
  dateOfBirth,
  bloodType,
  height,
  weight,
  onFirstNameChange,
  onLastNameChange,
  onDateOfBirthChange,
  onBloodTypeChange,
  onHeightChange,
  onWeightChange,
  onComplete,
  onSkip,
}: ProfileWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
  const inputRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEPS.indexOf(currentStep as any);
  const progress = currentStep === 'intro' ? 0 : currentStep === 'complete' ? 100 : ((stepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (open && currentStep !== 'intro' && currentStep !== 'complete') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentStep, open]);

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep as any);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      setCurrentStep('complete');
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleStart = () => {
    setCurrentStep('firstName');
  };

  const handleLater = () => {
    onSkip?.();
    onOpenChange(false);
    setCurrentStep('intro');
  };

  const handleFinish = () => {
    onComplete();
    onOpenChange(false);
    setCurrentStep('intro');
  };

  const stepConfig = {
    firstName: {
      icon: User,
      title: "Comment vous appelez-vous ?",
      subtitle: "Votre prénom pour personnaliser l'expérience",
      placeholder: "Prénom",
      value: firstName,
      onChange: onFirstNameChange,
    },
    lastName: {
      icon: User,
      title: "Et votre nom de famille ?",
      subtitle: "Pour compléter votre identité",
      placeholder: "Nom",
      value: lastName,
      onChange: onLastNameChange,
    },
    dateOfBirth: {
      icon: Calendar,
      title: "Quelle est votre date de naissance ?",
      subtitle: "Pour calculer votre âge automatiquement",
      isDate: true,
      placeholder: "",
      value: "",
      onChange: () => {},
    },
    bloodType: {
      icon: Droplets,
      title: "Quel est votre groupe sanguin ?",
      subtitle: "Information médicale importante",
      placeholder: "Ex: A+, O-, AB+...",
      value: bloodType,
      onChange: onBloodTypeChange,
    },
    height: {
      icon: Ruler,
      title: "Quelle est votre taille ?",
      subtitle: "En centimètres, pour calculer votre IMC",
      placeholder: "170",
      value: height,
      onChange: onHeightChange,
      type: "number",
      suffix: "cm",
    },
    weight: {
      icon: Scale,
      title: "Et votre poids actuel ?",
      subtitle: "En kilogrammes, pour le suivi de votre santé",
      placeholder: "70",
      value: weight,
      onChange: onWeightChange,
      type: "number",
      suffix: "kg",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">Assistant de profil</DialogTitle>
        
        {/* Progress bar */}
        {currentStep !== 'intro' && currentStep !== 'complete' && (
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Étape {stepIndex + 1} sur {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Intro Step */}
            {currentStep === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Bienvenue ! 🎉</h2>
                  <p className="text-muted-foreground">
                    Prenez un moment pour compléter votre profil. Ces informations nous aideront à personnaliser votre expérience.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button onClick={handleStart} className="w-full" size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Compléter mon profil
                  </Button>
                  <Button onClick={handleLater} variant="ghost" className="w-full">
                    Plus tard
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Field Steps */}
            {STEPS.includes(currentStep as any) && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {(() => {
                  const config = stepConfig[currentStep as keyof typeof stepConfig];
                  const Icon = config.icon;
                  
                  return (
                    <>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold mb-1">{config.title}</h2>
                        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
                      </div>

                      <div className="space-y-2">
                        {'isDate' in config && config.isDate ? (
                          <ModernDatePicker
                            value={dateOfBirth}
                            onChange={onDateOfBirthChange}
                            placeholder="Sélectionner une date"
                          />
                        ) : (
                          <div className="relative">
                            <Input
                              ref={inputRef}
                              type={'type' in config ? config.type : 'text'}
                              placeholder={config.placeholder}
                              value={'value' in config ? config.value : ''}
                              onChange={(e) => 'onChange' in config && config.onChange(e.target.value)}
                              className="text-lg h-12 pr-12"
                            />
                            {'suffix' in config && config.suffix && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {config.suffix}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={handleSkip} variant="ghost" className="flex-1">
                          Passer
                        </Button>
                        <Button onClick={handleNext} className="flex-1">
                          Suivant
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Complete Step */}
            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center"
                >
                  <Check className="w-10 h-10 text-green-500" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Parfait ! 🎊</h2>
                  <p className="text-muted-foreground">
                    Votre profil est maintenant configuré. Vous pouvez modifier ces informations à tout moment.
                  </p>
                </div>
                <Button onClick={handleFinish} className="w-full" size="lg">
                  C'est parti !
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
