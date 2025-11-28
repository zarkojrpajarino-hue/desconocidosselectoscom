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
    { path: '/herramientas/customer-journey', label: 'Customer Journey' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Botón Volver al Menú */}
      <Button
        variant="outline"
        onClick={() => navigate('/home')}
        className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Volver al Menú</span>
      </Button>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">🎨 Herramientas Visuales</h1>
        </div>

        {/* Tabs superiores */}
        <div className="border-b border-border mb-6 overflow-x-auto">
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
