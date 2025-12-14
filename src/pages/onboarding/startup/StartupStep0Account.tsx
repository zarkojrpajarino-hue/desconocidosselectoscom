import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, Rocket } from "lucide-react";
import { toast } from "sonner";

interface StartupStep0AccountProps {
  onAccountCreated: (userId: string, organizationId: string) => void;
}

export default function StartupStep0Account({ onAccountCreated }: StartupStep0AccountProps) {
  const { user, userOrganizations } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    contactName: '',
    accountEmail: '',
    accountPassword: '',
    startupName: ''
  });

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      setFormData(prev => ({ 
        ...prev,
        accountEmail: user.email || '',
        contactName: user.user_metadata?.full_name || ''
      }));
    }
  }, [user]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.accountEmail && !isLoggedIn) {
        checkEmailExists(formData.accountEmail);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.accountEmail, isLoggedIn]);

  const createOrganizationAndRole = async (userId: string, contactName: string, contactEmail: string) => {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: formData.startupName,
        industry: 'Startup',
        company_size: '1-5',
        business_description: 'Startup en fase de ideación',
        target_customers: 'Por definir',
        value_proposition: 'Por definir',
        sales_process: 'Por definir',
        lead_sources: [],
        products_services: [],
        team_structure: [],
        main_objectives: 'Validar idea y lanzar MVP',
        kpis_to_measure: [],
        current_problems: 'Por definir durante el onboarding',
        contact_name: contactName,
        contact_email: contactEmail,
        created_by: userId,
      })
      .select()
      .single();

    if (orgError) {
      throw new Error(`Error al crear organización: ${orgError.message}`);
    }

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        organization_id: org.id,
        role: 'admin',
        role_name: 'Fundador',
        role_description: 'Fundador de la startup'
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
    }

    return org;
  };

  const handleCreateAccount = async () => {
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
    if (!formData.startupName) {
      toast.error("Por favor ingresa el nombre de tu startup");
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

      const userId = authData.user.id;

      let userCreated = false;
      for (let i = 0; i < 6; i++) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
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

      const org = await createOrganizationAndRole(userId, formData.contactName, formData.accountEmail);
      
      setIsLoggedIn(true);
      toast.success('¡Cuenta y startup creados! Ahora continúa con el onboarding.');
      onAccountCreated(userId, org.id);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creando la cuenta';
      toast.error(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleContinueExisting = async () => {
    if (!user) return;
    if (!formData.startupName) {
      toast.error("Por favor ingresa el nombre de tu startup");
      return;
    }

    setIsCreatingAccount(true);

    try {
      const org = await createOrganizationAndRole(user.id, user.user_metadata?.full_name || '', user.email || '');
      toast.success('¡Startup creada! Ahora continúa con el onboarding.');
      onAccountCreated(user.id, org.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creando la startup';
      toast.error(errorMessage);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Rocket className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-lg md:text-2xl font-bold">Crea tu Cuenta de Startup</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {isLoggedIn 
              ? "Ya tienes una cuenta. Ahora crea tu startup."
              : "Primero, configura tu cuenta para iniciar tu startup"
            }
          </p>
        </div>
      </div>

      {isLoggedIn && userOrganizations.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-medium">Ya tienes una cuenta</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Logueado como: <Badge variant="secondary">{user?.email}</Badge>
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="startupName">Nombre de tu Startup *</Label>
          <Input
            id="startupName"
            type="text"
            placeholder="Mi Startup Increíble"
            value={formData.startupName}
            onChange={(e) => setFormData(prev => ({ ...prev, startupName: e.target.value }))}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Este será el nombre de tu proyecto o empresa
          </p>
        </div>

        {!isLoggedIn && (
          <>
            <div>
              <Label htmlFor="contactName">Tu nombre completo *</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Juan García"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="accountEmail">Email de acceso *</Label>
              <Input
                id="accountEmail"
                type="email"
                placeholder="tu@email.com"
                value={formData.accountEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, accountEmail: e.target.value }))}
                required
              />
              
              {emailExists && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Este email ya está registrado. <a href="/" className="underline font-medium">Inicia sesión</a> para crear otra organización.
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="accountPassword">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="accountPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.accountPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountPassword: e.target.value }))}
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
          </>
        )}

        {!isLoggedIn && (
          <Button 
            onClick={handleCreateAccount}
            disabled={isCreatingAccount || !formData.contactName || !formData.accountEmail || !formData.accountPassword || formData.accountPassword.length < 8 || !formData.startupName || emailExists}
            className="w-full"
            size="lg"
          >
            {isCreatingAccount ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando cuenta y startup...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Crear Cuenta y Startup
              </>
            )}
          </Button>
        )}

        {isLoggedIn && (
          <Button 
            onClick={handleContinueExisting}
            disabled={isCreatingAccount || !formData.startupName}
            className="w-full"
            size="lg"
          >
            {isCreatingAccount ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando startup...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Crear Mi Startup
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
