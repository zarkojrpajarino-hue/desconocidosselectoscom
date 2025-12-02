import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { NO_ORG_REQUIRED_ROUTES } from '@/constants/limits';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, currentOrganizationId, userOrganizations } = useAuth();
  const location = useLocation();
  
  // Verificar si la ruta actual no requiere organización
  const isNoOrgRoute = NO_ORG_REQUIRED_ROUTES.some(route => 
    location.pathname.startsWith(route)
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
  
  // 2. Sin usuario → login (guardar ruta actual para redirigir después)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. Si está en ruta que NO requiere org, permitir acceso
  if (isNoOrgRoute) {
    return <>{children}</>;
  }
  
  // 4. Necesita org pero no tiene ninguna → onboarding
  if (!currentOrganizationId && userOrganizations.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // 5. Tiene orgs pero no ha seleccionado → selector (con returnTo para volver)
  if (!currentOrganizationId && userOrganizations.length > 0) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/select-organization?returnTo=${returnTo}`} replace />;
  }
  
  // 6. Todo bien, mostrar contenido
  return <>{children}</>;
};

export default ProtectedRoute;
