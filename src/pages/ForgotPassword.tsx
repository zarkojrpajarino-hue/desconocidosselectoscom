// src/pages/ForgotPassword.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Email enviado', {
        description: 'Revisa tu bandeja de entrada',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al enviar email';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-3 md:p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-3 md:space-y-4 p-4 md:p-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold">Email Enviado</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Hemos enviado un link a: <br />
              <strong className="text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Haz clic en el link para restablecer tu contraseña. El link expira en 1 hora.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => { setEmailSent(false); setEmail(''); }}
              >
                Enviar a otro email
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-3 md:p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/login')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl md:text-2xl font-bold">Recuperar Contraseña</CardTitle>
          </div>
          <CardDescription className="text-xs md:text-sm">
            Ingresa tu email para recibir un link de recuperación
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Link de Recuperación'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">¿Recordaste tu contraseña? </span>
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/login')}>
              Iniciar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
