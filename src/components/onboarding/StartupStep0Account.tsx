// src/components/onboarding/StartupStep0Account.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Rocket, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StartupStep0AccountProps {
  onAccountCreated: (userId: string, organizationId: string) => void;
}

export default function StartupStep0Account({ onAccountCreated }: StartupStep0AccountProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setIsCreating(true);

    try {
      // 1. Crear usuario en auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este email ya está registrado. Por favor inicia sesión.');
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      const userId = authData.user.id;

      // 2. Esperar a que el trigger cree el usuario en public.users
      let userCreated = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (userData) {
          userCreated = true;
          break;
        }
      }

      if (!userCreated) {
        throw new Error('Error al crear el perfil de usuario. Intenta nuevamente.');
      }

      // 3. Crear organización temporal/minimal para el startup con todos los campos requeridos
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `Startup de ${formData.fullName.split(' ')[0]}`,
          created_by: userId,
          plan: 'trial',
          subscription_status: 'trial',
          industry: 'technology',
          company_size: '1-10',
          contact_name: formData.fullName,
          contact_email: formData.email,
          business_description: 'Por definir durante onboarding',
          target_customers: 'Por definir durante onboarding',
          sales_process: 'Por definir',
          current_problems: 'Por definir',
          main_objectives: 'Por definir',
          value_proposition: 'Por definir',
          lead_sources: [],
          kpis_to_measure: [],
          products_services: [],
          team_structure: [],
          business_type: 'startup'
        })
        .select()
        .single();

      if (orgError) throw orgError;
      if (!orgData) throw new Error('No se pudo crear la organización');

      // 4. Crear user_role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          organization_id: orgData.id,
          role: 'admin' as const
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        // No lanzar error, continuar
      }

      toast.success('¡Cuenta creada exitosamente! 🎉');
      
      // 5. Callback con userId y organizationId
      onAccountCreated(userId, orgData.id);

    } catch (error: unknown) {
      console.error('Error creating account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <Rocket className="h-8 w-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-3xl">Crea tu cuenta</CardTitle>
          <CardDescription className="text-base">
            Primero necesitamos crear tu cuenta para empezar el onboarding de tu startup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Rocket className="h-4 w-4" />
            <AlertDescription>
              Después de crear tu cuenta, completarás un cuestionario estratégico diseñado para startups 🚀
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Nombre completo */}
            <div>
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan García"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  setErrors({ ...errors, fullName: '' });
                }}
                className={errors.fullName ? 'border-destructive' : ''}
                disabled={isCreating}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@empresa.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: '' });
                }}
                className={errors.email ? 'border-destructive' : ''}
                disabled={isCreating}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setErrors({ ...errors, password: '' });
                }}
                className={errors.password ? 'border-destructive' : ''}
                disabled={isCreating}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setErrors({ ...errors, confirmPassword: '' });
                }}
                className={errors.confirmPassword ? 'border-destructive' : ''}
                disabled={isCreating}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Botón Crear Cuenta */}
          <Button
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Crear Cuenta y Continuar
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Al crear una cuenta, aceptas nuestros términos y condiciones
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
