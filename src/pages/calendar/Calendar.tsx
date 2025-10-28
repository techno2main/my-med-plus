import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useMonthIntakes } from "./hooks/useMonthIntakes";
import { useDayDetails } from "./hooks/useDayDetails";
import { useVisitDates } from "./hooks/useVisitDates";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarView } from "./components/CalendarView";
import { DayDetailsPanel } from "./components/DayDetailsPanel";

const Calendar = () => {
  const navigate = useNavigate();
  
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Hooks
  const visitDates = useVisitDates();
  const { monthIntakes, observanceRate, loading: monthLoading } = useMonthIntakes({ currentMonth });
  const { dayDetails, loading: dayLoading } = useDayDetails({ 
    selectedDate, 
    treatmentStartDate: visitDates.treatmentStartDate 
  });
  
  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Calendrier" 
          subtitle="Suivi détaillé des prises"
        />

        {/* Stats Overview */}
        <CalendarHeader visitDates={visitDates} />

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6">
          {/* Calendar */}
          <CalendarView
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onMonthChange={setCurrentMonth}
            onDateSelect={setSelectedDate}
            monthIntakes={monthIntakes}
            treatmentStartDate={visitDates.treatmentStartDate}
            nextPharmacyVisit={visitDates.nextPharmacyVisit}
            nextDoctorVisit={visitDates.nextDoctorVisit}
          />
          
          {/* Day Details */}
          <DayDetailsPanel
            selectedDate={selectedDate}
            dayDetails={dayDetails}
            loading={dayLoading}
            treatmentStartDate={visitDates.treatmentStartDate}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
