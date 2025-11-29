import { useAuth } from '@/contexts/AuthContext';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, DollarSign, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MetricsHub = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const metricsOptions = [
    {
      title: "KPI's",
      description: 'Actualiza KPIs reales: ventas, marketing, operaciones y cliente',
      icon: TrendingUp,
      path: '/business-metrics',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'OKR',
      description: 'Sistema de objetivos con tracking de progreso y resultados clave',
      icon: Target,
      path: '/okrs',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Panel Financiero',
      description: 'Métricas financieras, ingresos, gastos, margen y burn rate',
      icon: DollarSign,
      path: '/financial',
      gradient: 'from-green-500 to-emerald-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Métricas del Negocio
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestiona KPIs, OKRs y finanzas de tu negocio
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Menú
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Hola {userProfile?.full_name || 'Usuario'}
          </h2>
          <p className="text-muted-foreground">
            Selecciona el sistema de métricas con el que quieres trabajar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metricsOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.path}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => navigate(option.path)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <CardDescription className="text-base">
                    {option.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MetricsHub;
