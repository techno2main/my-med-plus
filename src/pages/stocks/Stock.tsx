import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { StockAlerts } from "./components/StockAlerts";
import { StockList } from "./components/StockList";
import { useStock } from "./hooks/useStock";
import { Loader2 } from "lucide-react";

export default function Stock() {
  const { stockItems, lowStockCount, isLoading, handleAdjust, handleViewDetails } = useStock();

  if (isLoading) {
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
          <PageHeader title="Gestion des stocks" backTo="/settings" />
        </div>

        <div className="mt-4 space-y-6">

        <StockAlerts lowStockCount={lowStockCount} />

        <StockList
          items={stockItems}
          onAdjust={handleAdjust}
          onViewDetails={handleViewDetails}
        />
        </div>
      </div>
    </AppLayout>
  );
}
