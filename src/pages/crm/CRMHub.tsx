import { useAuth } from '@/contexts/AuthContext';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CRMHub = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const crmOptions = [
    {
      title: 'CRM & Leads',
      description: 'Gestión de contactos y oportunidades de venta',
      explanation: 'El CRM es tu base de datos de clientes potenciales y actuales. Aquí gestionas toda la información de contactos, empresas, intereses y comunicaciones. Es el corazón de tu proceso comercial donde capturas y organizas cada lead.',
      icon: Users,
      path: '/crm/leads',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Pipeline de Ventas',
      description: 'Visualiza y gestiona el embudo completo de conversión',
      explanation: 'El Pipeline es tu visión estratégica del proceso de ventas. Visualiza cada lead en su etapa del embudo (Lead → Calificado → Propuesta → Negociación → Ganado/Perdido), con valores estimados y probabilidades. Te permite prever ingresos y detectar cuellos de botella.',
      icon: TrendingUp,
      path: '/crm/pipeline',
      gradient: 'from-emerald-500 to-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                CRM & Pipeline de Ventas
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestiona leads, oportunidades y tu proceso comercial
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/metrics')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Métricas
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Hola {userProfile?.full_name || 'Usuario'}
          </h2>
          <p className="text-muted-foreground">
            Selecciona la vista con la que quieres trabajar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {crmOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.path}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50 group"
                onClick={() => navigate(option.path)}
              >
                <CardHeader className="space-y-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="text-base font-medium">
                      {option.description}
                    </CardDescription>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {option.explanation}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default CRMHub;
