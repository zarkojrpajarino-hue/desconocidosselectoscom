import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Map, Layers } from 'lucide-react';

const Herramientas = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: 'Lead Scoring',
      description: 'Califica y prioriza tus leads',
      icon: TrendingUp,
      path: '/herramientas/lead-scoring'
    },
    {
      title: 'Growth Model',
      description: 'Modelo de crecimiento de tu negocio',
      icon: Layers,
      path: '/herramientas/growth-model'
    },
    {
      title: 'Buyer Persona',
      description: 'Define tu cliente ideal',
      icon: Users,
      path: '/herramientas/buyer-persona'
    },
    {
      title: 'Customer Journey',
      description: 'Mapea el viaje del cliente',
      icon: Map,
      path: '/herramientas/customer-journey'
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">🎨 Herramientas Visuales</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.path}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => navigate(tool.path)}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Herramientas;
