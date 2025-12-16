import { ToastActionElement } from "@/components/ui/toast";

interface ToastProps {
  title: string;
  description: string;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
}

type ToastFunction = (props: ToastProps) => void;

/**
 * Gère les erreurs d'authentification
 */
export const handleAuthError = (
  toast: ToastFunction,
  error?: string
): void => {
  console.error("[TreatmentWizard] Utilisateur non authentifié:", error);
  toast({
    title: "Erreur d'authentification",
    description: "Vous devez être connecté pour créer un traitement.",
    variant: "destructive",
  });
};

/**
 * Gère les erreurs génériques lors de la soumission
 */
export const handleSubmitError = (
  toast: ToastFunction,
  error: unknown,
  context: string = "Création du traitement"
): void => {
  console.error(`[TreatmentWizard] ${context}:`, error);
  toast({
    title: "Erreur",
    description: `Impossible de créer le traitement.`,
    variant: "destructive",
  });
};

/**
 * Affiche un message de validation manquante
 */
export const handleValidationError = (toast: ToastFunction): void => {
  toast({
    title: "Informations manquantes",
    description: "Veuillez renseigner tous les champs obligatoires avant de créer le traitement.",
    variant: "destructive",
  });
};

/**
 * Affiche un message de succès
 */
export const handleSubmitSuccess = (toast: ToastFunction): void => {
  toast({
    title: "Traitement créé",
    description: "Le traitement a été créé avec succès.",
  });
};
