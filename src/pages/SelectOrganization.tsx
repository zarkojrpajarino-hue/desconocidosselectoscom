import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserOrganization {
  organization_id: string;
  role: string;
  organization_name: string;
  organization: {
    id: string;
    name: string;
    industry: string;
  };
}

export default function SelectOrganization() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const returnTo = searchParams.get('returnTo') || '/dashboard/home';

  useEffect(() => {
    loadUserOrganizations();
  }, []);

  const loadUserOrganizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Cargar organizaciones del usuario desde user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          organization_id,
          role,
          organization:organizations(id, name, industry)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        // No tiene organizaciones, redirigir a onboarding
        navigate('/onboarding');
        return;
      }

      setOrganizations(data as any);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast.error('Error al cargar organizaciones');
    } finally {
      setLoading(false);
    }
  };

  const selectOrganization = (orgId: string) => {
    // Guardar organización seleccionada en localStorage
    localStorage.setItem('current_organization_id', orgId);
    
    toast.success('Organización seleccionada');
    navigate(returnTo);
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    if (role === 'admin') return 'default';
    if (role === 'ventas' || role === 'marketing') return 'secondary';
    return 'outline';
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      ventas: 'Ventas',
      marketing: 'Marketing',
      operaciones: 'Operaciones',
      custom: 'Personalizado'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Selecciona tu <span className="text-primary">Organización</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Elige con qué empresa quieres trabajar hoy
          </p>
        </div>

        {/* Organizaciones */}
        <div className="grid gap-4 mb-6">
          {organizations.map((org) => (
            <Card 
              key={org.organization_id} 
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
              onClick={() => selectOrganization(org.organization_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">
                      {org.organization?.name || 'Organización'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {org.organization?.industry || 'Sin industria'}
                    </p>
                    <Badge variant={getRoleBadgeVariant(org.role)}>
                      {getRoleLabel(org.role)}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        {/* Botón crear nueva organización */}
        <Card className="p-6 border-2 border-dashed border-muted hover:border-primary transition-all">
          <Button
            variant="ghost"
            className="w-full h-auto py-6"
            onClick={() => navigate('/onboarding')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-1">
                  Crear Nueva Organización
                </h3>
                <p className="text-sm text-muted-foreground">
                  Explica tu propia empresa y genera tu app personalizada
                </p>
              </div>
            </div>
          </Button>
        </Card>

        {/* Info adicional */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Puedes cambiar de organización en cualquier momento desde tu perfil</p>
        </div>
      </div>
    </div>
  );
}
