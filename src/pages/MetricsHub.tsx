import { useAuth } from '@/contexts/AuthContext';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, DollarSign, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionTourButton } from '@/components/SectionTourButton';

const MetricsHub = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const metricsOptions = [
    {
      title: "KPI's",
      description: 'Indicadores Clave de Rendimiento operativo',
      explanation: 'Los KPIs son métricas operativas del día a día de tu negocio: ventas, leads, conversiones, engagement, NPS, etc. Te permiten medir el rendimiento actual de cada área y tomar decisiones rápidas basadas en datos reales.',
      icon: TrendingUp,
      path: '/business-metrics',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'OKR',
      description: 'Objetivos estratégicos y Resultados Clave medibles',
      explanation: 'Los OKRs definen hacia dónde vas estratégicamente. A diferencia de los KPIs que miden lo que ya haces, los OKRs establecen metas ambiciosas y medibles que impulsan cambio e innovación alineados con tu rol.',
      icon: Target,
      path: '/okrs',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Panel Financiero',
      description: 'Métricas financieras consolidadas del negocio',
      explanation: 'El Panel Financiero te da la visión económica completa: ingresos, gastos, margen, burn rate, ROI de marketing y proyecciones. Es tu tablero de control para la salud financiera y sostenibilidad del negocio.',
      icon: DollarSign,
      path: '/financial',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'CRM & Pipeline',
      description: 'Gestión de leads y embudo de ventas',
      explanation: 'El CRM gestiona tus contactos y oportunidades comerciales. El Pipeline visualiza tu embudo de conversión por etapas (Lead → Qualified → Proposal → Won/Lost), permitiéndote prever ingresos y optimizar tu proceso de ventas.',
      icon: Users,
      path: '/crm',
      gradient: 'from-blue-500 to-cyan-500'
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
          <div className="flex items-center gap-2">
            <SectionTourButton sectionId="metrics-hub" />
            <Button
              variant="outline"
              onClick={() => navigate('/home')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Menú
            </Button>
          </div>
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

        <div id="metrics-sections" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricsOptions.map((option) => {
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

export default MetricsHub;
