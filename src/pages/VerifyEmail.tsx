// src/pages/VerifyEmail.tsx

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    const checkVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        toast.success('¡Email verificado!');
        navigate('/setup');
      }
    };
    checkVerification();
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('No se encontró el email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResent(true);
      toast.success('Email reenviado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al reenviar email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Verifica tu Email
          </CardTitle>
          <CardDescription className="text-base">
            Hemos enviado un link de verificación a:
            <br />
            <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium">Revisa tu bandeja de entrada</p>
                <p className="text-blue-600 dark:text-blue-400 mt-1">
                  Si no lo ves, revisa la carpeta de spam
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              ¿No recibiste el email?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendEmail}
              disabled={loading || resent}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : resent ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Email reenviado
                </>
              ) : (
                'Reenviar email de verificación'
              )}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Volver al inicio de sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
