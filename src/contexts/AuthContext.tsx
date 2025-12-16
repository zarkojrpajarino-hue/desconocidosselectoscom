import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/auth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UserOrganization {
  organization_id: string;
  role: string;
  organization_name: string;
  plan: string;
}

interface UserRoleQueryResult {
  organization_id: string;
  role: string;
  organizations: { name: string; plan: string } | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  currentOrganizationId: string | null;
  userOrganizations: UserOrganization[];
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  switchOrganization: (organizationId: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
            await loadUserOrganizations(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
          setUserOrganizations([]);
          setCurrentOrganizationId(null);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
        await loadUserOrganizations(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserOrganizations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          organization_id,
          role,
          organizations!inner(name, plan)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const orgs = (data as UserRoleQueryResult[]).map((item) => ({
          organization_id: item.organization_id,
          role: item.role,
          organization_name: item.organizations?.name || 'Sin nombre',
          plan: item.organizations?.plan || 'free'
        }));
        
        setUserOrganizations(orgs);
        
        // Cargar organización guardada o usar la primera
        const savedOrgId = localStorage.getItem('current_organization_id');
        if (savedOrgId && orgs.some(o => o.organization_id === savedOrgId)) {
          setCurrentOrganizationId(savedOrgId);
        } else if (orgs.length === 1) {
          // Si solo tiene una organización, seleccionarla automáticamente
          setCurrentOrganizationId(orgs[0].organization_id);
          localStorage.setItem('current_organization_id', orgs[0].organization_id);
        } else {
          // Si tiene múltiples y no hay guardada, mostrar selector
          setCurrentOrganizationId(null);
        }
      }
    } catch (error) {
      logger.error('Error loading user organizations:', error instanceof Error ? error.message : String(error));
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      // Obtener datos del usuario de auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        // Asegurar que email y full_name tengan valores válidos
        const profile = data as UserProfile;
        const userEmail = authUser?.email || profile.email || '';
        const emailName = userEmail.split('@')[0] || 'Usuario';
        
        setUserProfile({
          ...profile,
          email: userEmail,
          full_name: profile.full_name || emailName,
          username: profile.username || emailName,
        });
      } else if (authUser) {
        // Si no hay perfil en users pero hay auth user, crear perfil básico
        const userEmail = authUser.email || '';
        const emailName = userEmail.split('@')[0] || 'Usuario';
        
        setUserProfile({
          id: userId,
          email: userEmail,
          full_name: authUser.user_metadata?.full_name || emailName,
          username: emailName,
          role: 'employee',
          organization_id: null,
          strategic_objectives: null,
          created_at: null,
          updated_at: null,
        });
      } else if (error) {
        logger.error('Error fetching user profile:', error);
      }
    } catch (error) {
      logger.error('Exception fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('Login error:', error.message);
      }
      
      return { error };
    } catch (error) {
      logger.error('Unexpected login error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setUserOrganizations([]);
    setCurrentOrganizationId(null);
    localStorage.removeItem('current_organization_id');
    navigate('/login');
  };

  const switchOrganization = (organizationId: string) => {
    setCurrentOrganizationId(organizationId);
    localStorage.setItem('current_organization_id', organizationId);
    toast.success('Organización cambiada');
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        session, 
        userProfile, 
        currentOrganizationId,
        userOrganizations,
        signIn, 
        signOut, 
        switchOrganization,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};