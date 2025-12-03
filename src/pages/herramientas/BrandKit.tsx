import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { BrandKitBuilder } from '@/components/branding/BrandKitBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrandKitPage = () => {
  const { organizationId, organizationName } = useCurrentOrganization();
  const navigate = useNavigate();

  if (!organizationId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay organización seleccionada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Selecciona una organización para crear tu Brand Kit
            </p>
            <Button onClick={() => navigate('/select-organization')}>
              Seleccionar Organización
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/herramientas')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Herramientas
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Brand Kit</h1>
            <p className="text-muted-foreground">
              {organizationName ? `Identidad visual de ${organizationName}` : 'Crea tu identidad de marca'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            ¿Qué incluye el Brand Kit?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Paleta de Colores</p>
                <p className="text-muted-foreground text-xs">5 colores con psicología</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Tipografías</p>
                <p className="text-muted-foreground text-xs">Google Fonts optimizadas</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Tono de Voz</p>
                <p className="text-muted-foreground text-xs">Guía de comunicación</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="font-medium">Export Markdown</p>
                <p className="text-muted-foreground text-xs">CSS + Tailwind ready</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Kit Builder */}
      <BrandKitBuilder 
        organizationId={organizationId}
        businessName={organizationName || ''}
      />
    </div>
  );
};

export default BrandKitPage;
