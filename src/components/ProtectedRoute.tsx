import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, currentOrganizationId, userOrganizations } = useAuth();
  const location = useLocation();
  
  // Rutas que no requieren organización seleccionada
  const noOrgRequiredRoutes = [
    '/select-organization',
    '/onboarding',
    '/generating-workspace',
    '/profile',
    '/join'
  ];
  
  const isNoOrgRoute = noOrgRequiredRoutes.some(route => 
    location.pathname.startsWith(route)
  );
  
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
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si el usuario no tiene organización seleccionada y tiene organizaciones disponibles
  if (!isNoOrgRoute && !currentOrganizationId && userOrganizations.length > 0) {
    return <Navigate to="/select-organization" replace />;
  }
  
  // Si no tiene ninguna organización, redirigir a onboarding
  if (!isNoOrgRoute && !currentOrganizationId && userOrganizations.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
