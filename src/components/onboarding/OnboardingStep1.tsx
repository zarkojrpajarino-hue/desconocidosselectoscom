import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingFormData } from "@/pages/Onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep1Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  onAccountCreated?: () => void;
}

export const OnboardingStep1 = ({ formData, updateFormData, onAccountCreated }: OnboardingStep1Props) => {
  const { user, userOrganizations } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
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

  const handleCreateAccount = async () => {
    // Validaciones
    if (!formData.contactName) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }
    if (!formData.accountEmail) {
      toast.error("Por favor ingresa tu email");
      return;
    }
    if (!formData.accountPassword || formData.accountPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setIsCreatingAccount(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.accountEmail,
        password: formData.accountPassword,
        options: {
          data: {
            full_name: formData.contactName,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('Este email ya está registrado. Por favor inicia sesión primero.');
          return;
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Esperar a que el trigger cree el usuario en public.users
      let userCreated = false;
      for (let i = 0; i < 6; i++) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
          .single();
        
        if (userData) {
          userCreated = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!userCreated) {
        throw new Error('Error al configurar el usuario. Intenta de nuevo.');
      }

      setAccountCreated(true);
      setIsLoggedIn(true);
      toast.success('¡Cuenta creada! Ahora continúa con el onboarding.');
      
      if (onAccountCreated) {
        onAccountCreated();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creando la cuenta';
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

      {/* Mensaje de cuenta creada */}
      {accountCreated && !userOrganizations.length && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">¡Cuenta creada exitosamente!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ya puedes continuar con el siguiente paso para configurar tu organización.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Campo Nombre - Solo si NO está logueado */}
        {!isLoggedIn && (
          <div>
            <Label htmlFor="contactName">Tu nombre completo *</Label>
            <Input
              id="contactName"
              type="text"
              placeholder="Juan García"
              value={formData.contactName}
              onChange={(e) => updateFormData({ contactName: e.target.value })}
              required
              disabled={accountCreated}
              className={accountCreated ? "bg-muted" : ""}
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
            disabled={isLoggedIn || accountCreated}
            className={(isLoggedIn || accountCreated) ? "bg-muted" : ""}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isLoggedIn 
              ? "Usarás tu cuenta existente"
              : "Usarás este email para acceder a tu app"
            }
          </p>
          
          {/* Mensaje si el email ya existe */}
          {emailExists && !isLoggedIn && !accountCreated && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Este email ya está registrado. <a href="/" className="underline font-medium">Inicia sesión</a> para crear otra organización.
              </span>
            </div>
          )}
        </div>

        {/* Password - Solo si NO está logueado y cuenta no creada */}
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

        {/* Botón Crear Cuenta - Solo si NO está logueado y cuenta no creada */}
        {!isLoggedIn && !accountCreated && (
          <Button 
            onClick={handleCreateAccount}
            disabled={isCreatingAccount || !formData.contactName || !formData.accountEmail || !formData.accountPassword || formData.accountPassword.length < 8 || emailExists}
            className="w-full"
            size="lg"
          >
            {isCreatingAccount ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
