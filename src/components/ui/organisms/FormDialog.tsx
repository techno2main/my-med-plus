import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface FormDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when dialog should close
   */
  onClose: () => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog description (optional)
   */
  description?: string;
  /**
   * Form content/fields
   */
  children: ReactNode;
  /**
   * Callback when form is submitted
   */
  onSubmit: () => void;
  /**
   * Label for submit button
   */
  submitLabel?: string;
  /**
   * Label for cancel button
   */
  cancelLabel?: string;
  /**
   * Whether submit button should be disabled
   */
  submitDisabled?: boolean;
  /**
   * Whether to show the back arrow button in header
   */
  showBackButton?: boolean;
  /**
   * Custom footer content (replaces default buttons)
   */
  customFooter?: ReactNode;
}

/**
 * FormDialog component following Atomic Design principles (Organism).
 * Provides a consistent dialog layout for forms across the application.
 * Features: ScrollArea for long forms, back button, standard action buttons.
 * 
 * @example
 * ```tsx
 * <FormDialog
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Ajouter une pathologie"
 *   description="Ajoutez une nouvelle pathologie au référentiel"
 *   onSubmit={handleSubmit}
 *   submitLabel="Ajouter"
 * >
 *   <div className="space-y-4">
 *     <FormField label="Nom" value={name} onChange={setName} />
 *     <FormField label="Description" value={desc} onChange={setDesc} />
 *   </div>
 * </FormDialog>
 * ```
 */
export function FormDialog({
  open,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  submitDisabled = false,
  showBackButton = true,
  customFooter,
}: FormDialogProps) {
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-muted-foreground px-6">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {children}
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 bg-background">
          {customFooter || (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 h-9" type="button">
                {cancelLabel}
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1 gradient-primary h-9" 
                disabled={submitDisabled}
                type="submit"
              >
                {submitLabel}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
