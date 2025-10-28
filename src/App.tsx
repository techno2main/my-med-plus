import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UpdateNotification } from "./components/UpdateNotification";
import { NotificationSchedulerProvider } from "./components/NotificationSchedulerProvider";
import { useAutoRegenerateIntakes } from "./hooks/useAutoRegenerateIntakes";
import Index from "./pages/index/Index";
import Auth from "./pages/auth/Auth";
import Treatments from "./pages/treatments/Treatments";
import Calendar from "./pages/calendar/Calendar";
import Stock from "./pages/stock/Stock";
import Prescriptions from "./pages/prescriptions/Prescriptions";
import Settings from "./pages/settings/Settings";
import History from "./pages/history/History";
import TreatmentForm from "./pages/treatment-form/TreatmentForm";
import StockForm from "./pages/stock/StockForm";
import MedicationCatalog from "./pages/medication-catalog/MedicationCatalog";
import Referentials from "./pages/referentials/Referentials";
import HealthProfessionals from "./pages/health-professionals/HealthProfessionals";
import Pathologies from "./pages/pathologies/Pathologies";
import Allergies from "./pages/allergies/Allergies";
import Profile from "./pages/profile/Profile";
import Privacy from "./pages/privacy/Privacy";
import About from "./pages/about/About";
import StockDetails from "./pages/stock/StockDetails";
import TreatmentEdit from "./pages/treatment-edit/TreatmentEdit";
import NotificationSettings from "./pages/notification-settings/NotificationSettings";
import NotificationDebug from "./pages/admin/NotificationDebug";
import NavigationManager from "./pages/admin/NavigationManager";
import Admin from "./pages/admin/dashboard/AdminDashboard";
import NotFound from "./pages/not-found/NotFound";
import Rattrapage from "./pages/rattrapage/Rattrapage";

const queryClient = new QueryClient();

const App = () => {
  // Régénération automatique des prises toutes les 6h
  useAutoRegenerateIntakes();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UpdateNotification />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NotificationSchedulerProvider>
          <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/treatments" element={<ProtectedRoute><Treatments /></ProtectedRoute>} />
          <Route path="/treatments/new" element={<ProtectedRoute><TreatmentForm /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/stock/new" element={<ProtectedRoute><StockForm /></ProtectedRoute>} />
          <Route path="/stock/adjust" element={<ProtectedRoute><StockForm /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
          <Route path="/medications" element={<ProtectedRoute><MedicationCatalog /></ProtectedRoute>} />
          <Route path="/referentials" element={<ProtectedRoute><Referentials /></ProtectedRoute>} />
          <Route path="/referentials/health-professionals" element={<ProtectedRoute><HealthProfessionals /></ProtectedRoute>} />
          <Route path="/referentials/pathologies" element={<ProtectedRoute><Pathologies /></ProtectedRoute>} />
          <Route path="/referentials/allergies" element={<ProtectedRoute><Allergies /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/navigation" element={<ProtectedRoute><NavigationManager /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/notifications/debug" element={<ProtectedRoute><NotificationDebug /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/stock/:id" element={<ProtectedRoute><StockDetails /></ProtectedRoute>} />
          <Route path="/treatments/:id/edit" element={<ProtectedRoute><TreatmentEdit /></ProtectedRoute>} />
          <Route path="/rattrapage" element={<ProtectedRoute><Rattrapage /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </NotificationSchedulerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
