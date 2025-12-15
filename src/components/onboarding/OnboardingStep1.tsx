import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingFormData } from "@/pages/Onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep1Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  onAccountCreated?: (userId: string) => void;
  accountAlreadyCreated?: boolean;
}

export const OnboardingStep1 = ({ 
  formData, 
  updateFormData, 
  onAccountCreated,
  accountAlreadyCreated = false 
}: OnboardingStep1Props) => {
  const { user, userOrganizations } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(accountAlreadyCreated);
  const [showPassword, setShowPassword] = useState(false);

  // Detectar si el usuario ya está logueado
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      setAccountCreated(true);
      updateFormData({ 
        accountEmail: user.email || '',
        contactName: user.user_metadata?.full_name || ''
      });
    }
  }, [user]);

  // Verificar si el email ya existe
  const checkEmailExists = async (email: string) => {
    if (!email || email.length < 5 || isLoggedIn) return;
    
    setCheckingEmail(true);
    try {
      const { data, error } = await supabase.rpc('check_email_exists', { p_email: email });
      if (!error) {
        setEmailExists(data === true);
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Debounce email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.accountEmail && !isLoggedIn) {
        checkEmailExists(formData.accountEmail);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.accountEmail, isLoggedIn]);

  // Función para crear cuenta
  const handleCreateAccount = async () => {
    // Validaciones
    if (!formData.contactName || !formData.accountEmail || !formData.accountPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (formData.accountPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (emailExists) {
      toast.error('Este email ya está registrado. Por favor inicia sesión.');
      return;
    }

    setIsCreatingAccount(true);

    try {
      // Crear usuario
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.accountEmail,
        password: formData.accountPassword,
        options: {
          data: {
            full_name: formData.contactName,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este email ya está registrado. Por favor inicia sesión primero.');
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      const userId = authData.user.id;

      // Esperar a que el trigger cree el usuario en public.users
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
        throw new Error('Error al crear el perfil de usuario. Por favor intenta nuevamente.');
      }

      toast.success('¡Cuenta creada exitosamente! 🎉');
      setAccountCreated(true);

      // Callback al padre
      if (onAccountCreated) {
        onAccountCreated(userId);
      }

    } catch (error: unknown) {
      console.error('Error creating account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      toast.error(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg md:text-2xl font-bold mb-2">Paso 1: Crea tu Cuenta</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          {isLoggedIn 
            ? "Ya tienes una cuenta. Estás creando una nueva organización."
            : accountCreated
            ? "Cuenta creada exitosamente. Continúa con el siguiente paso."
            : "Primero, configura tus credenciales de acceso"
          }
        </p>
      </div>

      {/* Mensaje si ya está logueado */}
      {isLoggedIn && userOrganizations.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-medium">Ya tienes organizaciones</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Estás creando una nueva organización con tu cuenta: <Badge variant="secondary">{user?.email}</Badge>
          </p>
        </div>
      )}

      {/* Mensaje si cuenta recién creada */}
      {accountCreated && !isLoggedIn && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">Cuenta creada exitosamente</span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Tu cuenta ha sido creada con el email: <Badge variant="secondary">{formData.accountEmail}</Badge>
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            Ahora puedes continuar completando los datos de tu organización.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Campo Nombre - Solo si NO está logueado y NO ha creado cuenta */}
        {!isLoggedIn && !accountCreated && (
          <div>
            <Label htmlFor="contactName">Tu nombre completo *</Label>
            <Input
              id="contactName"
              type="text"
              placeholder="Juan García"
              value={formData.contactName}
              onChange={(e) => updateFormData({ contactName: e.target.value })}
              required
              disabled={isCreatingAccount}
            />
          </div>
        )}

        <div>
          <Label htmlFor="accountEmail">Email de acceso *</Label>
          <Input
            id="accountEmail"
            type="email"
            placeholder="tu@empresa.com"
            value={formData.accountEmail}
            onChange={(e) => updateFormData({ accountEmail: e.target.value })}
            required
            disabled={isLoggedIn || accountCreated || isCreatingAccount}
            className={(isLoggedIn || accountCreated) ? "bg-muted" : ""}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isLoggedIn 
              ? "Usarás tu cuenta existente"
              : accountCreated
              ? "Cuenta creada con este email"
              : "Usarás este email para acceder a tu app"
            }
          </p>
          
          {/* Indicador de verificación de email */}
          {checkingEmail && !isLoggedIn && !accountCreated && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verificando email...</span>
            </div>
          )}
          
          {/* Mensaje si el email ya existe */}
          {emailExists && !checkingEmail && !isLoggedIn && !accountCreated && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Este email ya está registrado</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateFormData({ accountEmail: '' })}
                  className="flex-1"
                >
                  Usar otro email
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  Iniciar Sesión
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Password - Solo si NO está logueado y NO ha creado cuenta */}
        {!isLoggedIn && !accountCreated && (
          <div>
            <Label htmlFor="accountPassword">Contraseña *</Label>
            <div className="relative">
              <Input
                id="accountPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={formData.accountPassword}
                onChange={(e) => updateFormData({ accountPassword: e.target.value })}
                required
                minLength={8}
                disabled={isCreatingAccount}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 8 caracteres
            </p>
          </div>
        )}

        {/* Botón Crear Cuenta - Solo si NO está logueado y NO ha creado cuenta */}
        {!isLoggedIn && !accountCreated && (
          <Button
            onClick={handleCreateAccount}
            disabled={isCreatingAccount || emailExists || !formData.contactName || !formData.accountEmail || !formData.accountPassword}
            className="w-full"
            size="lg"
          >
            {isCreatingAccount ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Cuenta
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info adicional */}
      {!isLoggedIn && !accountCreated && (
        <p className="text-xs text-muted-foreground text-center">
          Al crear una cuenta, aceptas nuestros términos y condiciones
        </p>
      )}
    </div>
  );
};
