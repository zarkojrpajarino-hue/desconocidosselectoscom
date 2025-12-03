import { useAuth } from '@/contexts/AuthContext';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Palette, Target, Calculator, ArrowLeft } from 'lucide-react';
import { SectionTourButton } from '@/components/SectionTourButton';

const HerramientasHub = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

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
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Herramientas</h1>
            <p className="text-sm text-muted-foreground">Selecciona una sección</p>
          </div>
          <div className="flex items-center gap-2">
            <SectionTourButton sectionId="herramientas-hub" />
            <Button
              variant="outline"
              onClick={() => navigate('/home')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div id="tools-grid" data-tour="tools-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

export default HerramientasHub;
