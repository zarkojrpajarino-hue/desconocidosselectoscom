import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Conectando con Google Calendar...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // user_id
      const error = searchParams.get('error');

      if (error) {
        throw new Error('Usuario canceló la autorización');
      }

      if (!code || !state) {
        throw new Error('Parámetros inválidos');
      }

      // Llamar a la edge function para completar el OAuth
      const { error: callbackError } = await supabase.functions.invoke('google-auth-callback', {
        body: {
          code,
          user_id: state,
        },
      });

      if (callbackError) throw callbackError;

      // Sincronizar eventos inmediatamente
      await supabase.functions.invoke('sync-calendar-events', {
        body: { user_id: state },
      });

      setStatus('success');
      setMessage('✅ Google Calendar conectado y sincronizado');

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error in callback:', error);
      setStatus('error');
      setMessage(error.message || 'Error al conectar con Google Calendar');

      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
              <p className="text-lg font-medium">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto text-success" />
              <p className="text-lg font-medium text-success">{message}</p>
              <p className="text-sm text-muted-foreground">Redirigiendo...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-destructive" />
              <p className="text-lg font-medium text-destructive">{message}</p>
              <p className="text-sm text-muted-foreground">Redirigiendo...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallbackPage;
