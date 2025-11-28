import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Calculadora = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6">
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
          <h1 className="text-2xl font-bold">💰 Calculadora</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Oportunidad de Negocio</CardTitle>
            <CardDescription>
              Calcula el potencial de tu oportunidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Contenido próximamente... (aquí se importará el HTML)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calculadora;
