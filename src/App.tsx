import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-muted-foreground text-sm">Cargando...</p>
    </div>
  </div>
);

// Lazy loaded pages - Core (frequently used)
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const Pricing = lazy(() => import("./pages/Pricing"));

// Lazy loaded pages - Admin & Setup
const Admin = lazy(() => import("./pages/Admin"));
const Setup = lazy(() => import("./pages/Setup"));
const Profile = lazy(() => import("./pages/Profile"));

// Lazy loaded pages - Features
const Herramientas = lazy(() => import("./pages/Herramientas"));
const Practicar = lazy(() => import("./pages/Practicar"));
const Calculadora = lazy(() => import("./pages/Calculadora"));
const Gamification = lazy(() => import("./pages/Gamification"));
const AIAnalysis = lazy(() => import("./pages/AIAnalysis"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));

// Lazy loaded pages - Metrics
const BusinessMetrics = lazy(() => import("./pages/BusinessMetrics"));
const UserMetricsHistory = lazy(() => import("./pages/businessMetrics/UserMetricsHistory"));
const MetricsHub = lazy(() => import("./pages/MetricsHub"));
const HerramientasHub = lazy(() => import("./pages/HerramientasHub"));

// Lazy loaded pages - OKRs
const OKRsPage = lazy(() => import("./pages/OKRsPage"));
const OKRsHistory = lazy(() => import("./pages/okrs/OKRsHistory"));
const UserOKRHistory = lazy(() => import("./pages/okrs/UserOKRHistory"));
const OrganizationOKRs = lazy(() => import("./pages/okrs/OrganizationOKRs"));
const OrganizationOKRHistory = lazy(() => import("./pages/okrs/OrganizationOKRHistory"));

// Lazy loaded pages - Financial
const FinancialPage = lazy(() => import("./pages/FinancialPage"));
const TransactionsHistory = lazy(() => import("./pages/financial/TransactionsHistory"));
const UserTransactionsHistory = lazy(() => import("./pages/financial/UserTransactionsHistory"));

// Lazy loaded pages - CRM
const CRMPage = lazy(() => import("./pages/CRMPage"));
const CRMHub = lazy(() => import("./pages/crm/CRMHub"));
const Pipeline = lazy(() => import("./pages/crm/Pipeline"));
const UserLeadsPage = lazy(() => import("./pages/crm/UserLeadsPage"));

// Lazy loaded pages - Dashboard sub-pages
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const AgendaSemanal = lazy(() => import("./pages/dashboard/AgendaSemanal"));
const DashboardGamification = lazy(() => import("./pages/dashboard/Gamification"));
const DashboardNotifications = lazy(() => import("./pages/dashboard/DashboardNotifications"));

// Lazy loaded pages - Herramientas sub-pages
const LeadScoring = lazy(() => import("./pages/herramientas/LeadScoring"));
const GrowthModel = lazy(() => import("./pages/herramientas/GrowthModel"));
const BuyerPersona = lazy(() => import("./pages/herramientas/BuyerPersona"));
const CustomerJourney = lazy(() => import("./pages/herramientas/CustomerJourney"));

// Lazy loaded pages - Practicar sub-pages
const Simulador = lazy(() => import("./pages/practicar/Simulador"));
const Playbook = lazy(() => import("./pages/practicar/Playbook"));
const Guia = lazy(() => import("./pages/practicar/Guia"));

// Lazy loaded pages - Onboarding
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingSuccess = lazy(() => import("./pages/OnboardingSuccess"));
const AdminOnboardings = lazy(() => import("./pages/AdminOnboardings"));
const SelectOrganization = lazy(() => import("./pages/SelectOrganization"));
const GeneratingWorkspace = lazy(() => import("./pages/GeneratingWorkspace"));
const SelectRole = lazy(() => import("./pages/SelectRole"));

// Lazy loaded pages - Others
const GoogleCallbackPage = lazy(() => import("./pages/GoogleCallbackPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const AppContent = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing y Onboarding (público) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select-organization" element={
          <ProtectedRoute>
            <SelectOrganization />
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/generating-workspace" element={<GeneratingWorkspace />} />
        <Route path="/onboarding/success" element={<OnboardingSuccess />} />
        <Route path="/join/:token" element={
          <ProtectedRoute>
            <SelectRole />
          </ProtectedRoute>
        } />
        <Route path="/admin/onboardings" element={
          <ProtectedRoute>
            <AdminOnboardings />
          </ProtectedRoute>
        } />
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
          <Route path="notifications" element={<DashboardNotifications />} />
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
        <Route path="/business-metrics/user/:userId" element={
          <ProtectedRoute>
            <UserMetricsHistory />
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
        <Route path="/okrs/history/:userId" element={
          <ProtectedRoute>
            <UserOKRHistory />
          </ProtectedRoute>
        } />
        <Route path="/okrs/organization" element={
          <ProtectedRoute>
            <OrganizationOKRs />
          </ProtectedRoute>
        } />
        <Route path="/okrs/organization/history" element={
          <ProtectedRoute>
            <OrganizationOKRHistory />
          </ProtectedRoute>
        } />
        <Route path="/financial" element={
          <ProtectedRoute>
            <FinancialPage />
          </ProtectedRoute>
        } />
        <Route path="/financial/transactions" element={
          <ProtectedRoute>
            <TransactionsHistory />
          </ProtectedRoute>
        } />
        <Route path="/financial/transactions/user/:userId" element={
          <ProtectedRoute>
            <UserTransactionsHistory />
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        } />
        <Route path="/crm" element={
          <ProtectedRoute>
            <CRMPage />
          </ProtectedRoute>
        } />
        <Route path="/crm/hub" element={
          <ProtectedRoute>
            <CRMHub />
          </ProtectedRoute>
        } />
        <Route path="/crm/pipeline" element={
          <ProtectedRoute>
            <Pipeline />
          </ProtectedRoute>
        } />
        <Route path="/crm/user/:userId" element={
          <ProtectedRoute>
            <UserLeadsPage />
          </ProtectedRoute>
        } />
        <Route path="/herramientas-hub" element={
          <ProtectedRoute>
            <HerramientasHub />
          </ProtectedRoute>
        } />
        <Route path="/metrics" element={
          <ProtectedRoute>
            <MetricsHub />
          </ProtectedRoute>
        } />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoModeProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </DemoModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;
