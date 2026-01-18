import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { EmptyState } from "./components/EmptyState";
import { ActionSummary } from "./components/ActionSummary";
import { IntakeCard } from "./components/IntakeCard";
import { RattrapageConfirmationDialog } from "./components/ConfirmationDialog";
import { useMissedIntakesDetection } from "@/hooks/useMissedIntakesDetection";
import { useRattrapageActions } from "./hooks/useRattrapageActions";

export default function Rattrapage() {
  const { missedIntakes, totalMissed, loading } = useMissedIntakesDetection();
  const {
    actions,
    confirmDialog,
    saving,
    openConfirmDialog,
    confirmAction,
    handleCancelAll,
    handleSaveAll,
    pendingCount,
    processedCount,
    closeDialog,
  } = useRattrapageActions(missedIntakes);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-muted-foreground">Chargement...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          title="Mise à jour des prises"
          subtitle={totalMissed === 0 ? "Aucune prise non traitée" : `${totalMissed} prise${totalMissed > 1 ? 's' : ''} non traitée${totalMissed > 1 ? 's' : ''} à mettre à jour`}
          backTo="/"
        />

        {totalMissed === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ActionSummary
              totalMissed={totalMissed}
              processedCount={processedCount}
              pendingCount={pendingCount}
              onCancelAll={handleCancelAll}
              onSaveAll={handleSaveAll}
              saving={saving}
            />

            <div className="space-y-3">
              {missedIntakes.map((intake) => (
                <IntakeCard
                  key={intake.id}
                  intake={intake}
                  currentAction={actions[intake.id]}
                  onActionClick={openConfirmDialog}
                />
              ))}
            </div>

            <RattrapageConfirmationDialog
              confirmDialog={confirmDialog}
              onClose={closeDialog}
              onConfirm={confirmAction}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
