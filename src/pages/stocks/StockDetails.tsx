import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { StockDetailsCard } from "./components/StockDetailsCard";
import { Button } from "@/components/ui/button";
import { useStockDetails } from "./hooks/useStockDetails";
import { Loader2, Edit } from "lucide-react";

export default function StockDetails() {
  const {
    medication,
    currentStock,
    minThreshold,
    takesPerDay,
    unitsPerTake,
    status,
    estimatedDays,
    isLoading,
    handleAdjust,
    handleBack,
  } = useStockDetails();

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
      <div className="container max-w-2xl mx-auto px-3 md:px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <PageHeader title={`Détails - ${medication.name}`} backTo="/stocks" />
        </div>

        <div className="mt-4 space-y-6">

        <StockDetailsCard
          currentStock={currentStock}
          minThreshold={minThreshold}
          status={status}
          takesPerDay={takesPerDay}
          unitsPerTake={unitsPerTake}
          estimatedDays={estimatedDays}
          expiryDate={medication.expiry_date}
        />

        <Button onClick={handleAdjust} className="w-full">
          <Edit className="h-4 w-4 mr-2" />
          Ajuster le stock
        </Button>
        </div>
      </div>
    </AppLayout>
  );
}
