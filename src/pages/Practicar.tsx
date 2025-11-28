import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, BookOpen, MessageSquare } from 'lucide-react';

const Practicar = () => {
  const navigate = useNavigate();

  const practices = [
    {
      title: 'Simulador Ventas',
      description: 'Practica escenarios de venta',
      icon: Gamepad2,
      path: '/practicar/simulador'
    },
    {
      title: 'Sales Playbook',
      description: 'Libro de jugadas de ventas',
      icon: BookOpen,
      path: '/practicar/playbook'
    },
    {
      title: 'Guía Comunicación',
      description: 'Mejora tu comunicación',
      icon: MessageSquare,
      path: '/practicar/comunicacion'
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">🎯 Practicar</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practices.map((practice) => {
            const Icon = practice.icon;
            return (
              <Card
                key={practice.path}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => navigate(practice.path)}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{practice.title}</CardTitle>
                  <CardDescription>{practice.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Practicar;
