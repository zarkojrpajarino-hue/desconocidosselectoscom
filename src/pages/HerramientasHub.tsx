import { useAuth } from '@/contexts/AuthContext';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Palette, Target, Calculator, ArrowLeft, Crown } from 'lucide-react';
import { SectionTourButton } from '@/components/SectionTourButton';
import { EnterpriseToolsCatalog } from '@/components/enterprise/EnterpriseToolsCatalog';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { Badge } from '@/components/ui/badge';

const HerramientasHub = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { isEnterprise } = usePlanAccess();

  const sections = [
    {
      title: 'Herramientas Visuales',
      description: 'Lead Scoring, Growth Model, Buyer Persona, Customer Journey',
      icon: Palette,
      path: '/herramientas',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Practicar',
      description: 'Simulador, Sales Playbook, Guía de Comunicación',
      icon: Target,
      path: '/practicar',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'Calculadora',
      description: 'Oportunidad de Negocio',
      icon: Calculator,
      path: '/calculadora',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">Herramientas</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Selecciona una sección</p>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <SectionTourButton sectionId="herramientas-hub" className="hidden sm:flex" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/home')}
              className="gap-1 md:gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8 space-y-8">
        <div id="tools-grid" data-tour="tools-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

        {/* Catálogo Enterprise */}
        <div className="pt-4 border-t">
          <EnterpriseToolsCatalog />
        </div>
      </div>
    </div>
  );
};

export default HerramientasHub;
