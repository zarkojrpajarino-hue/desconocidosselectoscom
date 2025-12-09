import { Button } from '@/components/ui/button';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useEffect } from 'react';

const Herramientas = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir a lead-scoring si estamos en /herramientas exacto
  useEffect(() => {
    if (location.pathname === '/herramientas') {
      navigate('/herramientas/lead-scoring', { replace: true });
    }
  }, [location.pathname, navigate]);

  const tabs = [
    { path: '/herramientas/lead-scoring', label: 'Lead Scoring' },
    { path: '/herramientas/growth-model', label: 'Growth Model' },
    { path: '/herramientas/buyer-persona', label: 'Buyer Persona' },
    { path: '/herramientas/customer-journey', label: 'Customer Journey' },
    { path: '/herramientas/brand-kit', label: 'Brand Kit' }
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Botón Volver al Menú */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/home')}
        className="fixed top-2 right-2 md:top-4 md:right-4 z-50 gap-1 md:gap-2 shadow-lg h-8 md:h-10 text-xs md:text-sm"
      >
        <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
        <span className="hidden sm:inline">Volver</span>
      </Button>

      <div className="container max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-bold">🎨 Herramientas</h1>
        </div>

        {/* Tabs superiores - horizontal scroll en móvil */}
        <div className="border-b border-border mb-4 md:mb-6 overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent whitespace-nowrap"
                activeClassName="text-primary border-primary"
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Contenido de la sub-ruta */}
        <div className="bg-card rounded-lg border p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Herramientas;
