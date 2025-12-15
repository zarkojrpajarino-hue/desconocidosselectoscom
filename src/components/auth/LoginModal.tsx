import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast.error(t('auth.loginError', 'Error al iniciar sesión'), {
          description: t('auth.invalidCredentials', 'Usuario o contraseña incorrectos')
        });
        setLoading(false);
        return;
      }
      
      toast.success(t('auth.welcomeBack', '¡Bienvenido!'));
      onOpenChange(false);
      setEmail('');
      setPassword('');
      navigate('/home');
      
    } catch (error) {
      toast.error(t('common.unexpectedError', 'Error inesperado'));
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    onOpenChange(false);
    navigate('/forgot-password');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
            OPTIMUS-K
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('auth.loginDescription', 'Inicia sesión para acceder a tu cuenta')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t('auth.email', 'Email')}</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{t('auth.password', 'Contraseña')}</Label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary hover:underline"
              >
                {t('auth.forgotPassword', '¿Olvidaste tu contraseña?')}
              </button>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity h-11"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('auth.login', 'Iniciar Sesión')}
          </Button>
        </form>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('auth.noAccount', '¿No tienes cuenta?')}{' '}
          <button 
            type="button"
            onClick={() => {
              onOpenChange(false);
              const section = document.getElementById('how-it-works');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-primary hover:underline font-medium"
          >
            {t('auth.createAccount', 'Crea una ahora')}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};
