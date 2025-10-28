import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { StockAdjustmentForm } from "./components/StockAdjustmentForm";
import { useStockForm } from "./hooks/useStockForm";
import { Loader2 } from "lucide-react";

export default function StockForm() {
  const {
    medication,
    currentStock,
    adjustmentStr,
    setAdjustmentStr,
    adjustment,
    newStock,
    minThreshold,
    setMinThreshold,
    isLoading,
    handleSubmit,
    handleCancel,
  } = useStockForm();

  if (isLoading || !medication) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader title={`Ajuster le stock - ${medication.name}`} backTo="/stock" />

        <StockAdjustmentForm
          currentStock={currentStock}
          adjustmentStr={adjustmentStr}
          setAdjustmentStr={setAdjustmentStr}
          adjustment={adjustment}
          newStock={newStock}
          minThreshold={minThreshold}
          setMinThreshold={setMinThreshold}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
}
