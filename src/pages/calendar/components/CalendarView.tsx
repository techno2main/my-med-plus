import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, isSameDay, setMonth, setYear, getYear, getMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { RefreshCw, ChevronLeft, ChevronRight, ArrowLeft, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { getDayIndicator } from "../utils";
import { cn } from "@/lib/utils";
import type { DayIntake } from "../types";
import { useState } from "react";

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
  const [showMonthYearSelector, setShowMonthYearSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'month' | 'year'>('month');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const getDayIntake = (date: Date) => {
    return monthIntakes.find(intake => isSameDay(intake.date, date));
  };

  // Swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left = mois suivant
      onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    }
    
    if (isRightSwipe) {
      // Swipe right = mois précédent
      onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    }
  };

  // Sélecteur mois/année
  const MonthYearSelector = () => {
    const currentYear = getYear(currentMonth);
    const currentMonthIndex = getMonth(currentMonth);
    
    const currentYearNow = new Date().getFullYear();
    const startYear = currentYearNow - 10;
    const endYear = currentYearNow + 10;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    
    const months = Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format(setMonth(new Date(), i), 'MMMM', { locale: fr })
    }));

    if (selectorMode === 'year') {
      return (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectorMode('month')}
              className="h-8 px-2 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium flex-1 text-center">
              Sélectionner l'année
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
            {years.map((year) => (
              <Button
                key={year}
                variant={year === currentYear ? "default" : "outline"}
                className={cn(
                  "h-10 rounded-xl font-medium text-sm",
                  year === currentYear && "ring-2 ring-primary/30"
                )}
                onClick={() => {
                  onMonthChange(setYear(currentMonth, year));
                  setSelectorMode('month');
                }}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMonthYearSelector(false)}
            className="h-8 px-2 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectorMode('year')}
            className="h-8 px-3 rounded-full font-medium flex-1"
          >
            {currentYear}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month) => (
            <Button
              key={month.value}
              variant={month.value === currentMonthIndex ? "default" : "outline"}
              className={cn(
                "h-10 rounded-xl font-medium capitalize text-sm",
                month.value === currentMonthIndex && "ring-2 ring-primary/30"
              )}
              onClick={() => {
                onMonthChange(setMonth(currentMonth, month.value));
                setShowMonthYearSelector(false);
                setSelectorMode('month');
              }}
            >
              {month.label.substring(0, 4)}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 surface-elevated">
      <div className="space-y-4">
        {showMonthYearSelector ? (
          <MonthYearSelector />
        ) : (
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="select-none"
          >
            <div className="flex justify-between items-center px-0 pb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="h-9 w-9 rounded-full hover:bg-accent/50 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 flex-1 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowMonthYearSelector(true)}
                  className="text-sm font-medium hover:bg-accent/50 rounded-full px-3 h-8 capitalize"
                >
                  {format(currentMonth, 'MMMM', { locale: fr })}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowMonthYearSelector(true)}
                  className="text-sm font-medium hover:bg-accent/50 rounded-full px-3 h-8"
                >
                  {format(currentMonth, 'yyyy', { locale: fr })}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="h-9 w-9 rounded-full hover:bg-accent/50 flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <DayPicker
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
              className="p-0 border-0"
              classNames={{
                months: "flex flex-col",
                month: "space-y-3",
                caption: "hidden",
                caption_label: "hidden",
                nav: "hidden",
                nav_button: "hidden",
                nav_button_previous: "hidden",
                nav_button_next: "hidden",
                table: "w-full border-collapse pb-2",
                head_row: "flex w-full mb-1",
                head_cell: "text-muted-foreground flex-1 text-center font-medium text-xs uppercase",
                row: "flex w-full mt-1",
                cell: cn(
                  "relative p-0 text-center focus-within:relative focus-within:z-20 flex-1"
                ),
                day: cn(
                  "h-10 w-10 p-0 font-normal rounded-full mx-auto relative",
                  "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                ),
                day_selected: cn(
                  "bg-primary text-primary-foreground font-semibold",
                  "hover:bg-primary hover:text-primary-foreground"
                ),
                day_today: cn(
                  "bg-primary/20 text-primary font-bold"
                ),
                day_outside: "text-muted-foreground/40 opacity-50",
                day_disabled: "text-muted-foreground/30 opacity-40 hover:bg-transparent",
                day_hidden: "invisible",
              }}
              components={{
                DayContent: ({ date }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {format(date, "d")}
                    {getDayIndicator(date, monthIntakes, nextPharmacyVisit, nextDoctorVisit)}
                  </div>
                )
              }}
              showOutsideDays={false}
            />

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  onMonthChange(today);
                  onDateSelect(today);
                }}
                className="h-8 w-8 p-0 rounded-full"
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/calendar-sync")}
                className="gap-2 text-muted-foreground hover:text-foreground rounded-full"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Synchroniser</span>
              </Button>
            </div>
          </div>
        )}

        {!showMonthYearSelector && (
          <>
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

          </>
        )}
      </div>
    </Card>
  );
};
