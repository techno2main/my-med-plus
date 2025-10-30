import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExportConfig } from "../types";

interface PeriodSelectorProps {
  config: ExportConfig;
  onConfigChange: (config: Partial<ExportConfig>) => void;
}

export function PeriodSelector({ config, onConfigChange }: PeriodSelectorProps) {
  const handleStartDateChange = (date: Date | undefined) => {
    onConfigChange({ startDate: date ? format(date, 'yyyy-MM-dd') : null });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onConfigChange({ endDate: date ? format(date, 'yyyy-MM-dd') : null });
  };

  const clearStartDate = () => {
    onConfigChange({ startDate: null });
  };

  const clearEndDate = () => {
    onConfigChange({ endDate: null });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Période d'export</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Sélectionnez une période pour limiter les données exportées (optionnel)
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Date de début</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !config.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {config.startDate
                    ? format(new Date(config.startDate), 'dd/MM/yyyy', { locale: fr })
                    : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={config.startDate ? new Date(config.startDate) : undefined}
                  onSelect={handleStartDateChange}
                  initialFocus
                  locale={fr}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {config.startDate && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearStartDate}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Date de fin</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !config.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {config.endDate
                    ? format(new Date(config.endDate), 'dd/MM/yyyy', { locale: fr })
                    : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={config.endDate ? new Date(config.endDate) : undefined}
                  onSelect={handleEndDateChange}
                  initialFocus
                  locale={fr}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {config.endDate && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearEndDate}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
