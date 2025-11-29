import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Setup from "./pages/Setup";
import Herramientas from "./pages/Herramientas";
import Practicar from "./pages/Practicar";
import Calculadora from "./pages/Calculadora";
import Gamification from "./pages/Gamification";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import GoogleCallbackPage from "./pages/GoogleCallbackPage";
import AIAnalysis from "./pages/AIAnalysis";
import BusinessMetrics from "./pages/BusinessMetrics";
import UserMetricsHistoryPage from "./pages/UserMetricsHistoryPage";
import HerramientasHub from "./pages/HerramientasHub";
import OKRsPage from "./pages/OKRsPage";
import OKRsHistory from "./pages/okrs/OKRsHistory";
import FinancialPage from "./pages/FinancialPage";
import DetailedFinancial from "./pages/financial/DetailedFinancial";

// Dashboard sub-pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import AgendaSemanal from "./pages/dashboard/AgendaSemanal";
import DashboardGamification from "./pages/dashboard/Gamification";

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
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      
      {/* Dashboard con sub-rutas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }>
        <Route path="home" element={<DashboardHome />} />
        <Route path="agenda" element={<AgendaSemanal />} />
        <Route path="gamification" element={<DashboardGamification />} />
      </Route>
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/setup" element={<Setup />} />
      
      {/* Herramientas con sub-rutas */}
      <Route path="/herramientas" element={
        <ProtectedRoute>
          <Herramientas />
        </ProtectedRoute>
      }>
        <Route path="lead-scoring" element={<LeadScoring />} />
        <Route path="growth-model" element={<GrowthModel />} />
        <Route path="buyer-persona" element={<BuyerPersona />} />
        <Route path="customer-journey" element={<CustomerJourney />} />
      </Route>
      
      {/* Practicar con sub-rutas */}
      <Route path="/practicar" element={
        <ProtectedRoute>
          <Practicar />
        </ProtectedRoute>
      }>
        <Route path="simulador" element={<Simulador />} />
        <Route path="playbook" element={<Playbook />} />
        <Route path="guia" element={<Guia />} />
      </Route>
      
      <Route path="/calculadora" element={
        <ProtectedRoute>
          <Calculadora />
        </ProtectedRoute>
      } />
      <Route path="/gamification" element={
        <ProtectedRoute>
          <Gamification />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/ai-analysis" element={
        <ProtectedRoute>
          <AIAnalysis />
        </ProtectedRoute>
      } />
      <Route path="/business-metrics" element={
        <ProtectedRoute>
          <BusinessMetrics />
        </ProtectedRoute>
      } />
      <Route path="/okrs" element={
        <ProtectedRoute>
          <OKRsPage />
        </ProtectedRoute>
      } />
      <Route path="/okrs/history" element={
        <ProtectedRoute>
          <OKRsHistory />
        </ProtectedRoute>
      } />
      <Route path="/financial" element={
        <ProtectedRoute>
          <FinancialPage />
        </ProtectedRoute>
      } />
      <Route path="/financial/detailed" element={
        <ProtectedRoute>
          <DetailedFinancial />
        </ProtectedRoute>
      } />
      <Route path="/user-metrics/:userId" element={
        <ProtectedRoute>
          <UserMetricsHistoryPage />
        </ProtectedRoute>
      } />
      <Route path="/herramientas-hub" element={
        <ProtectedRoute>
          <HerramientasHub />
        </ProtectedRoute>
      } />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
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