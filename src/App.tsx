import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Setup from "./pages/Setup";
import Herramientas from "./pages/Herramientas";
import Practicar from "./pages/Practicar";
import Calculadora from "./pages/Calculadora";
import Gamification from "./pages/Gamification";
import NotFound from "./pages/NotFound";

// Herramientas sub-pages
import LeadScoring from "./pages/herramientas/LeadScoring";
import GrowthModel from "./pages/herramientas/GrowthModel";
import BuyerPersona from "./pages/herramientas/BuyerPersona";
import CustomerJourney from "./pages/herramientas/CustomerJourney";

// Practicar sub-pages
import Simulador from "./pages/practicar/Simulador";
import Playbook from "./pages/practicar/Playbook";
import Guia from "./pages/practicar/Guia";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/setup" element={<Setup />} />
      
      {/* Herramientas con sub-rutas */}
      <Route path="/herramientas" element={<Herramientas />}>
        <Route path="lead-scoring" element={<LeadScoring />} />
        <Route path="growth-model" element={<GrowthModel />} />
        <Route path="buyer-persona" element={<BuyerPersona />} />
        <Route path="customer-journey" element={<CustomerJourney />} />
      </Route>
      
      {/* Practicar con sub-rutas */}
      <Route path="/practicar" element={<Practicar />}>
        <Route path="simulador" element={<Simulador />} />
        <Route path="playbook" element={<Playbook />} />
        <Route path="guia" element={<Guia />} />
      </Route>
      
      <Route path="/calculadora" element={<Calculadora />} />
      <Route path="/gamification" element={<Gamification />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;