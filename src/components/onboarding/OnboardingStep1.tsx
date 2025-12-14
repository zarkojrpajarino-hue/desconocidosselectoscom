import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { OnboardingFormData } from "@/pages/Onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface OnboardingStep1Props {
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
}

export const OnboardingStep1 = ({ formData, updateFormData }: OnboardingStep1Props) => {
  const { user, userOrganizations } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Detectar si el usuario ya está logueado
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paso 1: Crea tu Cuenta</h2>
        <p className="text-muted-foreground">
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
            disabled={isLoggedIn}
            className={isLoggedIn ? "bg-muted" : ""}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isLoggedIn 
              ? "Usarás tu cuenta existente"
              : "Usarás este email para acceder a tu app"
            }
          </p>
          
          {/* Mensaje si el email ya existe */}
          {emailExists && !isLoggedIn && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Este email ya está registrado. <a href="/auth" className="underline font-medium">Inicia sesión</a> para crear otra organización.
              </span>
            </div>
          )}
        </div>

        {/* Password - Solo si NO está logueado */}
        {!isLoggedIn && (
          <div>
            <Label htmlFor="accountPassword">Contraseña *</Label>
            <Input
              id="accountPassword"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={formData.accountPassword}
              onChange={(e) => updateFormData({ accountPassword: e.target.value })}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 8 caracteres
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
