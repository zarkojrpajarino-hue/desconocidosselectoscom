import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Setup = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-users');
      
      if (error) throw error;
      
      setResults(data.results);
      toast.success('¡Sistema configurado!', {
        description: 'Todos los usuarios han sido creados'
      });
    } catch (error) {
      toast.error('Error al configurar sistema');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-2xl shadow-premium">
        <CardHeader>
          <CardTitle className="text-2xl">Configuración Inicial</CardTitle>
          <CardDescription>
            Ejecuta este proceso una sola vez para crear todos los usuarios del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSetup}
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Configurar Sistema
          </Button>

          {results && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-lg mb-3">Usuarios Creados:</h3>
              {results.map((result: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div>
                    <p className="font-medium">{result.user}</p>
                    {result.success && (
                      <p className="text-sm text-muted-foreground">
                        Contraseña: {result.password}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-sm text-destructive">{result.error}</p>
                    )}
                  </div>
                  {result.success && (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                </div>
              ))}
              <div className="mt-4 p-4 bg-accent/10 rounded-lg">
                <p className="text-sm font-medium">
                  Las contraseñas por defecto siguen el formato: [username]123
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por ejemplo: zarko123, angel123, etc.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;