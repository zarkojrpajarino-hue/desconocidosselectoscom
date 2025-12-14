import { Suspense, lazy } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const Integraciones = lazy(() => import("./pages/Integraciones"));

// Layout component
const AppLayout = lazy(() => import("./components/layout/AppLayout"));

// Lazy loaded pages - Admin
const Admin = lazy(() => import("./pages/Admin"));
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
const GlobalAgenda = lazy(() => import("./pages/GlobalAgenda"));
const DashboardGamification = lazy(() => import("./pages/dashboard/Gamification"));
const DashboardNotifications = lazy(() => import("./pages/dashboard/DashboardNotifications"));

// Lazy loaded pages - Herramientas sub-pages
const LeadScoring = lazy(() => import("./pages/herramientas/LeadScoring"));
const GrowthModel = lazy(() => import("./pages/herramientas/GrowthModel"));
const BuyerPersona = lazy(() => import("./pages/herramientas/BuyerPersona"));
const CustomerJourney = lazy(() => import("./pages/herramientas/CustomerJourney"));
const BrandKit = lazy(() => import("./pages/herramientas/BrandKit"));
const WebGenerator = lazy(() => import("./pages/herramientas/WebGenerator"));

// Lazy loaded pages - Practicar sub-pages
const Simulador = lazy(() => import("./pages/practicar/Simulador"));
const Playbook = lazy(() => import("./pages/practicar/Playbook"));
const Guia = lazy(() => import("./pages/practicar/Guia"));
const GuiaInteractiva = lazy(() => import("./pages/practicar/GuiaInteractiva"));

// Lazy loaded pages - Onboarding
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingStartup = lazy(() => import("./pages/onboarding/OnboardingStartup"));
const OnboardingSuccess = lazy(() => import("./pages/OnboardingSuccess"));
const AdminOnboardings = lazy(() => import("./pages/AdminOnboardings"));
const SelectPlan = lazy(() => import("./pages/SelectPlan"));
const GeneratingWorkspace = lazy(() => import("./pages/GeneratingWorkspace"));

// Lazy loaded pages - Others
const GoogleCallbackPage = lazy(() => import("./pages/GoogleCallbackPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy loaded pages - Scalability
const ScalabilityStart = lazy(() => import("./pages/ScalabilityStart"));
const ScalabilityDashboard = lazy(() => import("./pages/ScalabilityDashboard"));

// Lazy loaded pages - Settings
const ApiKeysPage = lazy(() => import("./pages/settings/ApiKeysPage"));

// Lazy loaded pages - BI Dashboard
const BIDashboard = lazy(() => import("./pages/BIDashboard"));

// Lazy loaded pages - PWA Install
const InstallPage = lazy(() => import("./pages/InstallPage"));

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
        {/* ===== RUTAS PÚBLICAS (sin layout) ===== */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Navigate to="/#how-it-works" replace />} />
        <Route path="/verify-email" element={<Navigate to="/#how-it-works" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/integraciones" element={<Integraciones />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/generating-workspace" element={<GeneratingWorkspace />} />
        <Route path="/onboarding/success" element={<OnboardingSuccess />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        
        {/* ===== RUTAS PROTEGIDAS SIN LAYOUT (flujos especiales) ===== */}
        <Route path="/select-organization" element={<Navigate to="/select-plan" replace />} />
        <Route path="/select-plan" element={
          <ProtectedRoute>
            <SelectPlan />
          </ProtectedRoute>
        } />
        <Route path="/onboarding/startup" element={
          <ProtectedRoute>
            <OnboardingStartup />
          </ProtectedRoute>
        } />
        <Route path="/join/:token" element={<Navigate to="/home" replace />} />
        
        {/* ===== RUTAS PROTEGIDAS CON NUEVO AppLayout ===== */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Home */}
          <Route path="/home" element={<Home />} />
          
          {/* Dashboard con sub-rutas */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="home" element={<DashboardHome />} />
            <Route path="agenda" element={<AgendaSemanal />} />
            <Route path="gamification" element={<DashboardGamification />} />
            <Route path="notifications" element={<DashboardNotifications />} />
          </Route>
          
          {/* Admin */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/onboardings" element={<AdminOnboardings />} />
          
          {/* Herramientas con sub-rutas */}
          <Route path="/herramientas" element={<Herramientas />}>
            <Route path="lead-scoring" element={<LeadScoring />} />
            <Route path="growth-model" element={<GrowthModel />} />
            <Route path="buyer-persona" element={<BuyerPersona />} />
            <Route path="customer-journey" element={<CustomerJourney />} />
            <Route path="brand-kit" element={<BrandKit />} />
            <Route path="web-generator" element={<WebGenerator />} />
          </Route>
          
          {/* Practicar con sub-rutas */}
          <Route path="/practicar" element={<Practicar />}>
            <Route path="simulador" element={<Simulador />} />
            <Route path="playbook" element={<Playbook />} />
            <Route path="guia" element={<Guia />} />
            <Route path="guia-interactiva" element={<GuiaInteractiva />} />
          </Route>
          
          {/* Páginas individuales */}
          <Route path="/calculadora" element={<Calculadora />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/ai-analysis" element={<AIAnalysis />} />
          <Route path="/alerts" element={<AlertsPage />} />
          
          {/* Business Metrics */}
          <Route path="/business-metrics" element={<BusinessMetrics />} />
          <Route path="/business-metrics/user/:userId" element={<UserMetricsHistory />} />
          <Route path="/metrics" element={<MetricsHub />} />
          
          {/* OKRs */}
          <Route path="/okrs" element={<OKRsPage />} />
          <Route path="/okrs/history" element={<OKRsHistory />} />
          <Route path="/okrs/history/:userId" element={<UserOKRHistory />} />
          <Route path="/okrs/organization" element={<OrganizationOKRs />} />
          <Route path="/okrs/organization/history" element={<OrganizationOKRHistory />} />
          
          {/* Financial */}
          <Route path="/financial" element={<FinancialPage />} />
          <Route path="/financial/transactions" element={<TransactionsHistory />} />
          <Route path="/financial/transactions/user/:userId" element={<UserTransactionsHistory />} />
          
          {/* CRM */}
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/crm/hub" element={<CRMHub />} />
          <Route path="/crm/pipeline" element={<Pipeline />} />
          <Route path="/crm/user/:userId" element={<UserLeadsPage />} />
          
          {/* Herramientas Hub */}
          <Route path="/herramientas-hub" element={<HerramientasHub />} />
          
          {/* Scalability */}
          <Route path="/scalability" element={<ScalabilityStart />} />
          <Route path="/scalability/:analysisId" element={<ScalabilityDashboard />} />
          
          {/* Settings */}
          <Route path="/settings/api-keys" element={<ApiKeysPage />} />
          
          {/* BI Dashboard */}
          <Route path="/bi" element={<BIDashboard />} />
          
          {/* Global Agenda */}
          <Route path="/agenda-global" element={<GlobalAgenda />} />
        </Route>
        
        {/* ===== 404 ===== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
  </ThemeProvider>
);

export default App;
