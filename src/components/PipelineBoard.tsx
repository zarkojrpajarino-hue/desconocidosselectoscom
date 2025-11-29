import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, RefreshCw, Euro, TrendingUp, Users, Target } from 'lucide-react';
import { toast } from 'sonner';
import LeadCard from '@/components/LeadCard';
import CreateLeadModal from '@/components/CreateLeadModal';
import LeadDetailModal from '@/components/LeadDetailModal';

interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_value: number;
  probability: number;
  expected_revenue: number;
  source?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  next_action?: string;
  next_action_date?: string;
  last_contact_date?: string;
  interested_products?: string[];
  notes?: string;
  created_at: string;
}

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-blue-100 border-blue-300' },
  { id: 'qualified', label: 'Calificado', color: 'bg-purple-100 border-purple-300' },
  { id: 'proposal', label: 'Propuesta', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'negotiation', label: 'Negociación', color: 'bg-orange-100 border-orange-300' },
  { id: 'won', label: 'Ganado', color: 'bg-green-100 border-green-300' },
  { id: 'lost', label: 'Perdido', color: 'bg-red-100 border-red-300' }
];

const PipelineBoard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();

    const subscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`*, assigned_to_name:users!leads_assigned_to_fkey(full_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedLeads = (data || []).map(lead => ({
        ...lead,
        assigned_to_name: (lead.assigned_to_name as any)?.full_name,
        priority: lead.priority as 'low' | 'medium' | 'high' | 'urgent'
      }));

      setLeads(transformedLeads as Lead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Error al cargar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (leadId: string, newStage: string) => {
    try {
      const updateData: any = { stage: newStage };
      if (newStage === 'won') updateData.won_date = new Date().toISOString().split('T')[0];
      if (newStage === 'lost') updateData.lost_date = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('leads').update(updateData).eq('id', leadId);
      if (error) throw error;

      toast.success('Lead actualizado');
      fetchLeads();
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Error al mover lead');
    }
  };

  const getLeadsByStage = (stage: string) => leads.filter(l => l.stage === stage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalPipelineValue = leads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + l.estimated_value, 0);
  const totalExpectedRevenue = leads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + l.expected_revenue, 0);
  const activeLeadsCount = leads.filter(l => !['won', 'lost'].includes(l.stage)).length;
  const wonThisMonth = leads.filter(l => {
    if (l.stage !== 'won' || !l.created_at) return false;
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Leads Activos
            </CardDescription>
            <CardTitle className="text-3xl">{activeLeadsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-success" />
              Pipeline Total
            </CardDescription>
            <CardTitle className="text-3xl text-success">{formatCurrency(totalPipelineValue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              Esperado
            </CardDescription>
            <CardTitle className="text-3xl text-warning">{formatCurrency(totalExpectedRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Ganados Este Mes
            </CardDescription>
            <CardTitle className="text-3xl text-primary">{wonThisMonth}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pipeline de Ventas</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeads} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.id);
          const stageValue = stageLeads.reduce((s, l) => s + l.estimated_value, 0);

          return (
            <div key={stage.id} className="space-y-3">
              <Card className={`${stage.color} border-2`}>
                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                  </div>
                  <CardDescription className="text-xs font-medium">{formatCurrency(stageValue)}</CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-2 min-h-[200px]">
                {stageLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }} />
                ))}
                {stageLeads.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">Sin leads</CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <CreateLeadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchLeads}
        />
      )}

      {showDetailModal && selectedLead && (
        <LeadDetailModal
          isOpen={showDetailModal}
          lead={selectedLead}
          onClose={() => { setShowDetailModal(false); setSelectedLead(null); }}
          onUpdate={fetchLeads}
          onMoveStage={handleMoveStage}
        />
      )}
    </div>
  );
};

export default PipelineBoard;