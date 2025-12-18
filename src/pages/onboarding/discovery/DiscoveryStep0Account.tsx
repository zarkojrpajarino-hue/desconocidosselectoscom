import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { DiscoveryFormData } from '@/types/discovery-onboarding';

interface Props {
  data: DiscoveryFormData;
  updateData: (data: Partial<DiscoveryFormData>) => void;
  onAccountCreated: () => void;
}

export default function DiscoveryStep0Account({ data, updateData, onAccountCreated }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const handleCreateAccount = async () => {
    if (!data.contactName || !data.accountEmail || !data.accountPassword) {
      toast.error('Completa todos los campos');
      return;
    }

    if (data.accountPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.accountEmail,
        password: data.accountPassword,
        options: {
          data: {
            full_name: data.contactName,
            onboarding_type: 'discovery'
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email ya está registrado. Prueba a iniciar sesión.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (authData.user) {
        setAccountCreated(true);
        toast.success('¡Cuenta creada! Continuemos con las preguntas.');
        onAccountCreated();
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (accountCreated) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">¡Cuenta creada!</h2>
        <p className="text-muted-foreground">Continuando con las preguntas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <User className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-bold">Crea tu cuenta gratuita</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Solo necesitas esto para guardar tus ideas
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Tu nombre *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="contactName"
              placeholder="Ej: María García"
              value={data.contactName}
              onChange={(e) => updateData({ contactName: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountEmail">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="accountEmail"
              type="email"
              placeholder="tu@email.com"
              value={data.accountEmail}
              onChange={(e) => updateData({ accountEmail: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountPassword">Contraseña *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="accountPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={data.accountPassword}
              onChange={(e) => updateData({ accountPassword: e.target.value })}
              className="pl-10 pr-10"
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
      </div>

      <Button 
        className="w-full" 
        size="lg"
        onClick={handleCreateAccount}
        disabled={loading}
      >
        {loading ? 'Creando cuenta...' : 'Crear Cuenta y Continuar'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Al crear tu cuenta aceptas nuestros términos y condiciones.
        <br />
        No spam, solo ideas de negocio.
      </p>
    </div>
  );
}
