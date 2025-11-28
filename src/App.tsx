import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Setup from "./pages/Setup";
import Herramientas from "./pages/Herramientas";
import Practicar from "./pages/Practicar";
import Calculadora from "./pages/Calculadora";
import NotFound from "./pages/NotFound";
import BottomNavbar from "@/components/BottomNavbar";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login' && location.pathname !== '/setup';

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/herramientas" element={<Herramientas />} />
        <Route path="/practicar" element={<Practicar />} />
        <Route path="/calculadora" element={<Calculadora />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNavbar && <BottomNavbar />}
    </>
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