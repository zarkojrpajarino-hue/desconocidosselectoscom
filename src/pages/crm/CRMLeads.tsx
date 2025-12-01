import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CreateLeadModal from '@/components/CreateLeadModal';
import LeadDetailModal from '@/components/LeadDetailModal';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currencyUtils';
import { LoadingTable } from '@/components/ui/loading-skeleton';

interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  priority: string;
  estimated_value: number;
  created_at: string;
  assigned_to: string | null;
  assigned_user_name?: string;
}

const CRMLeads = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_user:users!leads_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        toast.error('Error al cargar leads', {
          description: error.message || 'Intenta de nuevo más tarde'
        });
        return;
      }

      const leadsWithUserNames = data?.map(lead => ({
        ...lead,
        assigned_user_name: lead.assigned_user?.full_name
      })) || [];

      setLeads(leadsWithUserNames);
    } catch (error: any) {
      console.error('Unexpected error fetching leads:', error);
      toast.error('Error inesperado', {
        description: 'No se pudieron cargar los leads'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 h-8 bg-muted rounded w-1/4 animate-pulse" />
          <LoadingTable rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                CRM - Gestión de Leads
              </h1>
              <p className="text-sm text-muted-foreground">
                Base de datos de contactos y oportunidades
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/metrics')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Métricas
            </Button>
            <Button
              onClick={() => navigate('/crm/pipeline')}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Ver Pipeline
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-[1600px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Todos los Leads</h2>
            <p className="text-sm text-muted-foreground">
              {leads.length} contactos en total
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Nuevo Lead
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => {
                  setSelectedLead(lead);
                  setShowDetailModal(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <Badge className={getPriorityColor(lead.priority)}>
                      {lead.priority === 'high' ? 'Alta' : lead.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                  </div>
                  {lead.company && (
                    <CardDescription>{lead.company}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor estimado:</span>
                    <span className="font-semibold">{formatCurrency(lead.estimated_value)}</span>
                  </div>
                  {lead.email && (
                    <div className="text-sm text-muted-foreground truncate">
                      {lead.email}
                    </div>
                  )}
                  {lead.assigned_user_name && (
                    <div className="text-xs text-muted-foreground">
                      Asignado a: {lead.assigned_user_name}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchLeads();
          setShowCreateModal(false);
        }}
      />

      {selectedLead && (
        <LeadDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onUpdate={fetchLeads}
          onMoveStage={fetchLeads}
        />
      )}
    </div>
  );
};

export default CRMLeads;
