import { Button } from '@/components/ui/button';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useEffect } from 'react';

const Practicar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir a simulador si estamos en /practicar exacto
  useEffect(() => {
    if (location.pathname === '/practicar') {
      navigate('/practicar/simulador', { replace: true });
    }
  }, [location.pathname, navigate]);

  const tabs = [
    { path: '/practicar/simulador', label: 'Simulador Ventas' },
    { path: '/practicar/playbook', label: 'Sales Playbook' },
    { path: '/practicar/guia', label: 'Guía Comunicación' }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">🎯 Practicar</h1>
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

export default Practicar;
