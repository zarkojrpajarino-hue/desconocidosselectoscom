import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
        </div>
        
        <div className="w-full h-[calc(100vh-200px)] min-h-[600px]">
          <iframe
            src="/html/calculadora.html"
            className="w-full h-full border-0 rounded-lg shadow-lg"
            title="Calculadora de Oportunidad de Negocio"
          />
        </div>
      </div>
    </div>
  );
};

export default Calculadora;
