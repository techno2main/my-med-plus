import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useMonthIntakes } from "./hooks/useMonthIntakes";
import { useDayDetails } from "./hooks/useDayDetails";
import { useVisitDates } from "./hooks/useVisitDates";
import { useDayVisits } from "./hooks/useDayVisits";
import { useMonthVisits } from "./hooks/useMonthVisits";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarView } from "./components/CalendarView";
import { DayDetailsPanel } from "./components/DayDetailsPanel";

const Calendar = () => {
  const navigate = useNavigate();
  
  // Refs
  const pageTopRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const shouldScrollToDetails = useRef(false);
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Handler pour sélectionner une date (avec scroll)
  const handleDateSelect = (date: Date) => {
    shouldScrollToDetails.current = true;
    setSelectedDate(date);
  };
  
  // Hooks
  const visitDates = useVisitDates();
  const { monthIntakes, observanceRate, loading: monthLoading } = useMonthIntakes({ currentMonth });
  const { visits: monthVisits, loading: monthVisitsLoading } = useMonthVisits({ currentMonth });
  const { dayDetails, loading: dayLoading } = useDayDetails({ 
    selectedDate, 
    treatmentStartDate: visitDates.treatmentStartDate 
  });
  const { visits: dayVisits, loading: visitsLoading } = useDayVisits(selectedDate);
  
  // Scroll vers les détails quand la date change (mobile uniquement)
  useEffect(() => {
    // Ignorer le premier render (chargement initial de la page)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Ne scroller que si c'est un clic sur une date (pas lors de la navigation de mois)
    if (shouldScrollToDetails.current && window.innerWidth < 768 && detailsRef.current) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    
    // Réinitialiser le flag
    shouldScrollToDetails.current = false;
  }, [selectedDate]);
  
  // Handler pour remonter vers le haut de la page
  const scrollToCalendar = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <AppLayout>
      <div ref={pageTopRef} className="container max-w-2xl mx-auto px-3 md:px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <PageHeader 
            title="Calendrier" 
            subtitle="Suivi détaillé des prises"
          />
        </div>

        {/* Stats Overview - Masqué */}
        {/* <CalendarHeader visitDates={visitDates} /> */}

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 mt-4">
          {/* Calendar */}
          <CalendarView
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={setCurrentMonth}
              onDateSelect={handleDateSelect}
              monthIntakes={monthIntakes}
              monthVisits={monthVisits}
              treatmentStartDate={visitDates.treatmentStartDate}
              nextPharmacyVisit={visitDates.nextPharmacyVisit}
              nextDoctorVisit={visitDates.nextDoctorVisit}
            />

          
          {/* Day Details */}
          <div ref={detailsRef}>
            <DayDetailsPanel
              selectedDate={selectedDate}
              dayDetails={dayDetails}
              dayVisits={dayVisits}
              loading={dayLoading}
              treatmentStartDate={visitDates.treatmentStartDate}
              nextPharmacyVisit={visitDates.nextPharmacyVisit}
              nextDoctorVisit={visitDates.nextDoctorVisit}
              onScrollToCalendar={scrollToCalendar}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
