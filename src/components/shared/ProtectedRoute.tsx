import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { NO_ORG_REQUIRED_ROUTES } from '@/constants/limits';
import { useTrialBlocking } from '@/hooks/useTrialBlocking';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, currentOrganizationId, userOrganizations } = useAuth();
  const location = useLocation();
  const { isBlocked } = useTrialBlocking();
  
  // Verificar si la ruta actual no requiere organización
  const isNoOrgRoute = NO_ORG_REQUIRED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );
  
  // Rutas que no deben ser bloqueadas por trial
  const isTrialExemptRoute = ['/', '/profile', '/select-organization', '/onboarding', '/integraciones'].some(
    route => location.pathname === route || location.pathname.startsWith(route + '/')
  );
  
  // 1. Esperar a que cargue completamente
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }
  
  // 2. Sin usuario → landing (guardar ruta actual para redirigir después)
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // 3. Si el trial expiró y no está en ruta exenta → landing con pricing
  if (isBlocked && !isTrialExemptRoute) {
    return <Navigate to="/#pricing" replace />;
  }
  
  // 4. Si está en ruta que NO requiere org, permitir acceso
  if (isNoOrgRoute) {
    return <>{children}</>;
  }
  
  // 5. Necesita org pero no tiene ninguna → onboarding
  if (!currentOrganizationId && userOrganizations.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // 6. Tiene orgs pero no ha seleccionado → selector (con returnTo para volver)
  if (!currentOrganizationId && userOrganizations.length > 0) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/select-organization?returnTo=${returnTo}`} replace />;
  }
  
  // 7. Todo bien, mostrar contenido
  return <>{children}</>;
};

export default ProtectedRoute;
