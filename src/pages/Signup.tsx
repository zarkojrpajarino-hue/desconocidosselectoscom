// src/pages/Signup.tsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Check } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(pass)) return 'Debe contener al menos una mayúscula';
    if (!/[a-z]/.test(pass)) return 'Debe contener al menos una minúscula';
    if (!/[0-9]/.test(pass)) return 'Debe contener al menos un número';
    return null;
  };

  const getPasswordStrength = (pass: string): { level: number; text: string; color: string } => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;

    if (strength <= 2) return { level: strength, text: 'Débil', color: 'bg-red-500' };
    if (strength <= 3) return { level: strength, text: 'Media', color: 'bg-yellow-500' };
    return { level: strength, text: 'Fuerte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Por favor ingresa tu nombre completo');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (!acceptTerms) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Enviar email de bienvenida
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { userId: authData.user.id }
        });
      } catch (emailError) {
        console.warn('Error enviando email de bienvenida:', emailError);
      }

      toast.success('¡Cuenta creada exitosamente!', {
        description: 'Revisa tu email para verificar tu cuenta',
      });

      navigate('/verify-email', { state: { email } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('already registered')) {
        toast.error('Este email ya está registrado', {
          description: 'Intenta iniciar sesión o usa otro email',
        });
      } else {
        toast.error(message || 'Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <CardTitle className="text-xl md:text-2xl font-bold">Crear Cuenta</CardTitle>
          </div>
          <CardDescription className="text-xs md:text-sm">
            Completa tus datos para registrarte
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.level ? passwordStrength.color : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.color === 'bg-red-500' ? 'text-red-500' :
                    passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    Seguridad: {passwordStrength.text}
                  </p>
                </div>
              )}
              <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                <li className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${password.length >= 8 ? 'text-green-500' : 'text-muted-foreground/50'}`} />
                  Mínimo 8 caracteres
                </li>
                <li className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-muted-foreground/50'}`} />
                  Una mayúscula
                </li>
                <li className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-muted-foreground/50'}`} />
                  Un número
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                disabled={loading}
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto los{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  política de privacidad
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Iniciar Sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
