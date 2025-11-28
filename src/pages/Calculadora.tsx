import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import HTMLDocumentViewer from '@/components/HTMLDocumentViewer';

const Calculadora = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Botón Volver al Menú */}
      <Button
        variant="outline"
        onClick={() => navigate('/home')}
        className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Volver al Menú</span>
      </Button>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">💰 Calculadora de Oportunidad</h1>
          <p className="text-muted-foreground mt-2">
            Calcula el potencial de tu negocio y proyecta tu crecimiento.
          </p>
        </div>
        
        <HTMLDocumentViewer 
          htmlPath="/html/calculadora.html"
          title="Calculadora de Oportunidad de Negocio"
        />
      </div>
    </div>
  );
};

export default Calculadora;
