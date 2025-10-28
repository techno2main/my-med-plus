import { TreatmentFormData } from "./types";
import { useStep3Stocks } from "./hooks/useStep3Stocks";
import { EmptyStocksAlert } from "./components/EmptyStocksAlert";
import { EmptyStocksList } from "./components/EmptyStocksList";
import { StockCard } from "./components/StockCard";

interface Step3StocksProps {
  formData: TreatmentFormData;
  setFormData: (data: TreatmentFormData) => void;
}

export function Step3Stocks({ formData, setFormData }: Step3StocksProps) {
  const { hasEmptyStocks, updateStock, updateThreshold } = useStep3Stocks({
    formData,
    setFormData,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {hasEmptyStocks && <EmptyStocksAlert />}

      {formData.medications.length === 0 ? (
        <EmptyStocksList />
      ) : (
        <div className="space-y-4">
          {formData.medications.map((med, index) => (
            <StockCard
              key={index}
              medication={med}
              index={index}
              stock={formData.stocks[index]}
              onStockChange={updateStock}
              onThresholdChange={updateThreshold}
            />
          ))}
        </div>
      )}
    </div>
  );
}
