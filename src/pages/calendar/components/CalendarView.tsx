import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDayIndicator } from "../utils";
import type { DayIntake } from "../types";

interface CalendarViewProps {
  currentMonth: Date;
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  monthIntakes: DayIntake[];
  treatmentStartDate: Date | null;
  nextPharmacyVisit: Date | null;
  nextDoctorVisit: Date | null;
}

export const CalendarView = ({
  currentMonth,
  selectedDate,
  onMonthChange,
  onDateSelect,
  monthIntakes,
  treatmentStartDate,
  nextPharmacyVisit,
  nextDoctorVisit
}: CalendarViewProps) => {
  const navigate = useNavigate();
  
  const getDayIntake = (date: Date) => {
    return monthIntakes.find(intake => isSameDay(intake.date, date));
  };

  return (
    <Card className="p-6 surface-elevated">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold">
              {format(currentMonth, "yyyy", { locale: fr })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(currentMonth, "MMMM", { locale: fr })}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="h-8 w-8 p-0"
            >
              ←
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const today = new Date();
                onMonthChange(today);
                onDateSelect(today);
              }}
              className="h-8 px-2 text-xs"
            >
              Aujourd'hui
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="h-8 w-8 p-0"
            >
              →
            </Button>
          </div>
        </div>

        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onDateSelect(date);
              // Si la date sélectionnée est dans un mois différent, changer le mois affiché
              if (date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear()) {
                onMonthChange(new Date(date.getFullYear(), date.getMonth()));
              }
            }
          }}
          month={currentMonth}
          onMonthChange={onMonthChange}
          locale={fr}
          className="rounded-md border"
          modifiers={{
            booked: (date) => !!getDayIntake(date),
            today: (date) => isSameDay(date, new Date())
          }}
          modifiersClassNames={{
            booked: "font-semibold",
            today: "bg-primary/20 text-primary font-bold"
          }}
          components={{
            DayContent: ({ date }) => (
              <div className="relative w-full h-full flex items-center justify-center">
                {format(date, "d")}
                {getDayIndicator(date, monthIntakes, nextPharmacyVisit, nextDoctorVisit)}
              </div>
            )
          }}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Effectuées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span className="text-muted-foreground">Manquées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Prochaines</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚕️</span>
            <span className="text-muted-foreground">Pharmacie</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🩺</span>
            <span className="text-muted-foreground">Médecin</span>
          </div>
        </div>

        {/* Sync Button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/calendar-sync")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs">Synchroniser</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
