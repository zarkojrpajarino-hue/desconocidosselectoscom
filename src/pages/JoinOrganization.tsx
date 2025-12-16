/**
 * Página para unirse a una organización mediante link de invitación
 * El usuario selecciona su rol funcional de los 10 predefinidos
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Building2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { PREDEFINED_ROLES, AppRole } from '@/types/roles';
import { useTranslation } from 'react-i18next';

interface InvitationData {
  id: string;
  organization_id: string;
  is_active: boolean;
  organization: {
    name: string;
    industry: string | null;
  };
}

export default function JoinOrganization() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Formulario de registro (solo si no está logueado)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Selección de rol funcional
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  // Validar token al cargar
  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      
      // Buscar por token o custom_slug
      const { data, error: fetchError } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          organization_id,
          is_active,
          organization:organizations(name, industry)
        `)
        .or(`token.eq.${token},custom_slug.eq.${token}`)
        .single();

      if (fetchError || !data) {
        setError('El enlace de invitación no es válido o ha expirado.');
        return;
      }

      if (!data.is_active) {
        setError('Esta invitación ya no está activa.');
        return;
      }

      // Aplanar la respuesta
      const orgData = Array.isArray(data.organization) 
        ? data.organization[0] 
        : data.organization;

      setInvitation({
        id: data.id,
        organization_id: data.organization_id,
        is_active: data.is_active ?? false,
        organization: orgData || { name: 'Organización', industry: null }
      });

    } catch (err) {
      console.error('Error validating invitation:', err);
      setError('Error al validar la invitación.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!selectedRole) {
      toast.error('Selecciona tu rol funcional');
      return;
    }

    if (!invitation) return;

    setSubmitting(true);

    try {
      let userId = user?.id;

      // Si no está logueado, crear cuenta
      if (!user) {
        if (!fullName || !email || !password) {
          toast.error('Completa todos los campos');
          setSubmitting(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (signUpError) {
          toast.error(signUpError.message);
          setSubmitting(false);
          return;
        }

        userId = signUpData.user?.id;
      }

      if (!userId) {
        toast.error('Error al obtener usuario');
        setSubmitting(false);
        return;
      }

      // Verificar si ya pertenece a esta organización
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', invitation.organization_id)
        .single();

      if (existingRole) {
        toast.info('Ya perteneces a esta organización');
        navigate('/dashboard/home');
        return;
      }

      // Insertar user_role con rol funcional
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          organization_id: invitation.organization_id,
          role: selectedRole,
          role_name: PREDEFINED_ROLES.find(r => r.value === selectedRole)?.label || selectedRole
        });

      if (roleError) {
        console.error('Error inserting role:', roleError);
        toast.error('Error al unirse a la organización');
        setSubmitting(false);
        return;
      }

      // Asegurar que existe en tabla users
      await supabase.from('users').upsert({
        id: userId,
        email: user?.email || email,
        full_name: user?.user_metadata?.full_name || fullName,
        role: 'member'
      }, { onConflict: 'id' });

      toast.success(`¡Bienvenido a ${invitation.organization.name}!`);
      navigate('/dashboard/home');

    } catch (err) {
      console.error('Error joining organization:', err);
      toast.error('Error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Enlace Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrar roles (excluir admin para invitados)
  const availableRoles = PREDEFINED_ROLES.filter(r => r.value !== 'admin');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              Únete a {invitation?.organization.name}
            </CardTitle>
            <CardDescription className="mt-2">
              {invitation?.organization.industry && (
                <span className="text-muted-foreground">
                  Sector: {invitation.organization.industry}
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Formulario de registro (solo si no está logueado) */}
          {!user && (
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">Crea tu cuenta</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Usuario logueado */}
          {user && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Conectado como <strong>{user.email}</strong>
              </p>
            </div>
          )}

          {/* Selector de rol funcional */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Selecciona tu rol en el equipo</h3>
            <p className="text-sm text-muted-foreground">
              Tu rol determina las tareas que recibirás y cómo colaborarás con el equipo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableRoles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedRole === role.value
                      ? 'border-primary bg-primary/10 ring-2 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.label}</span>
                        {selectedRole === role.value && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Botón de confirmación */}
          <Button
            onClick={handleJoin}
            disabled={!selectedRole || submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              'Unirme al Equipo'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
