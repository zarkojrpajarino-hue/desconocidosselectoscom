import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExistingUserOptions } from '@/components/onboarding/ExistingUserOptions';

interface Organization {
  organization_id: string;
  organization_name: string;
  role: string;
}

export default function SelectOrganization() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
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

      setUserEmail(user.email || '');

      // Cargar organizaciones del usuario desde user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          organization_id,
          role,
          organization:organizations(name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        // No tiene organizaciones, redirigir a onboarding
        navigate('/onboarding');
        return;
      }

      // Mapear al formato que necesita ExistingUserOptions
      interface OrgData {
        organization_id: string;
        role: string;
        organization?: { name?: string };
      }
      const mappedOrgs = (data as OrgData[]).map((org) => ({
        organization_id: org.organization_id,
        organization_name: org.organization?.name || 'Sin nombre',
        role: org.role
      }));

      setOrganizations(mappedOrgs);
    } catch (error: unknown) {
      console.error('Error loading organizations:', error);
      toast.error('Error al cargar organizaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/onboarding');
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
      <div className="max-w-2xl mx-auto py-12">
        <ExistingUserOptions
          userEmail={userEmail}
          organizations={organizations}
          onCreateNew={handleCreateNew}
        />
      </div>
    </div>
  );
}
