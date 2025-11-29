import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Palette, Target, Calculator, Brain, TrendingUp } from 'lucide-react';

const Home = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Dashboard de Trabajo',
      description: 'Gestiona tus tareas semanales, agenda y gamificación',
      icon: BarChart3,
      path: '/dashboard',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Métricas del Negocio (KPI\'s)',
      description: 'Actualiza KPIs reales: ventas, marketing, operaciones y cliente',
      icon: TrendingUp,
      path: '/business-metrics',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'OKRs - Objetivos',
      description: 'Sistema de objetivos trimestrales con tracking de progreso y resultados clave',
      icon: Target,
      path: '/okrs',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Análisis con IA',
      description: 'Dashboard inteligente con insights profundos, proyecciones y recomendaciones accionables',
      icon: Brain,
      path: '/ai-analysis',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      title: 'Herramientas',
      description: 'Herramientas Visuales, Practicar y Calculadora',
      icon: Palette,
      path: '/herramientas-hub',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Bienvenido {userProfile?.full_name || 'Usuario'}
          </h1>
          <p className="text-muted-foreground">
            Selecciona una sección para comenzar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.path}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2"
                onClick={() => navigate(section.path)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
