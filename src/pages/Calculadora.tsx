import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Calculadora = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">💰 Calculadora</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Oportunidad de Negocio</CardTitle>
            <CardDescription>
              Calcula el potencial de tu oportunidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Contenido próximamente...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calculadora;
