import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import PrescriptionForm from "./pages/PrescriptionForm";
import ProForm from "./pages/ProForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/prescriptions/new" element={<ProtectedRoute><PrescriptionForm /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
