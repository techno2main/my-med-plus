import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UpdateNotification } from "./components/UpdateNotification";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Treatments from "./pages/Treatments";
import Calendar from "./pages/Calendar";
import Pros from "./pages/Pros";
import Stock from "./pages/Stock";
import Prescriptions from "./pages/Prescriptions";
import Settings from "./pages/Settings";
import History from "./pages/History";
import TreatmentForm from "./pages/TreatmentForm";
import StockForm from "./pages/StockForm";

import ProForm from "./pages/ProForm";
import MedicationCatalog from "./pages/MedicationCatalog";
import Referentials from "./pages/Referentials";
import HealthProfessionals from "./pages/HealthProfessionals";
import Pathologies from "./pages/Pathologies";
import Allergies from "./pages/Allergies";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import StockDetails from "./pages/StockDetails";
import TreatmentEdit from "./pages/TreatmentEdit";
import NotificationSettings from "./pages/NotificationSettings";
import NavigationManager from "./pages/NavigationManager";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Rattrapage from "./pages/Rattrapage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UpdateNotification />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/treatments" element={<ProtectedRoute><Treatments /></ProtectedRoute>} />
          <Route path="/treatments/new" element={<ProtectedRoute><TreatmentForm /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/stock/new" element={<ProtectedRoute><StockForm /></ProtectedRoute>} />
          <Route path="/stock/adjust" element={<ProtectedRoute><StockForm /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/pros" element={<ProtectedRoute><Pros /></ProtectedRoute>} />
          <Route path="/pros/new" element={<ProtectedRoute><ProForm /></ProtectedRoute>} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
