import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Calculadora = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
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
