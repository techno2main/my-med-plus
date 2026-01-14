import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when dialog should close
   */
  onClose: () => void;
  /**
   * Callback when action is confirmed
   */
  onConfirm: () => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Description/question to display
   */
  description: ReactNode;
  /**
   * Optional additional content to display
   */
  children?: ReactNode;
  /**
   * Label for confirm button
   */
  confirmLabel?: string;
  /**
   * Label for cancel button
   */
  cancelLabel?: string;
  /**
   * Variant for confirm button (default, destructive, etc.)
   */
  confirmVariant?: "default" | "destructive" | "outline" | "secondary";
  /**
   * Whether the confirm button should be disabled
   */
  confirmDisabled?: boolean;
  /**
   * Whether to show the footer buttons
   */
  showFooter?: boolean;
}

/**
 * ConfirmDialog component following Atomic Design principles (Organism).
 * Provides a consistent confirmation dialog across the application.
 * Used for delete confirmations, action confirmations, etc.
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 *   title="Confirmer la suppression"
 *   description="Êtes-vous sûr de vouloir supprimer cet élément ?"
 *   confirmLabel="Supprimer"
 *   confirmVariant="destructive"
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  confirmVariant = "default",
  confirmDisabled = false,
  showFooter = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        {showFooter && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
