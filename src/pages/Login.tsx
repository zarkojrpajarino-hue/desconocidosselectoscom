import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error('Error al iniciar sesión', {
          description: 'Usuario o contraseña incorrectos'
        });
      } else {
        toast.success('¡Bienvenido!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-premium">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
            Experiencia Selecta
          </CardTitle>
          <CardDescription className="text-center text-base">
            Sistema de gestión de tareas del equipo
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
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
          <div className="mt-6 text-sm text-muted-foreground text-center space-y-2">
            <p>Usuarios del equipo:</p>
            <p className="text-xs mt-1">zarko, angel, carla, miguel, fer, fernando, manu, casti, diego</p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs mb-2">¿Primera vez usando el sistema?</p>
              <Button
                variant="link"
                className="text-xs h-auto p-0"
                onClick={() => navigate('/setup')}
              >
                Ir a configuración inicial →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;