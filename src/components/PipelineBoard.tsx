import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lead, PipelineStage } from '@/types';
import { Plus, Filter } from 'lucide-react';
import LeadDetailModal from '@/components/LeadDetailModal';
import CreateLeadModal from '@/components/CreateLeadModal';
import PipelineLeadCard from '@/components/PipelineLeadCard';

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'discovery', label: 'Descubrimiento', color: 'bg-blue-500' },
  { value: 'demo', label: 'Demo', color: 'bg-purple-500' },
  { value: 'proposal', label: 'Propuesta', color: 'bg-yellow-500' },
  { value: 'negotiation', label: 'Negociación', color: 'bg-orange-500' },
  { value: 'closed_won', label: 'Ganado', color: 'bg-green-500' },
  { value: 'closed_lost', label: 'Perdido', color: 'bg-red-500' },
];

const PipelineBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAssigned, setFilterAssigned] = useState<string>('all');
  const [filterMinValue, setFilterMinValue] = useState<string>('0');

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterType, filterAssigned, filterMinValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadLeads(), loadUsers()]);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      toast.error('Error al cargar el pipeline');
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          creator:users!leads_created_by_fkey(id, full_name, role),
          assignee:users!leads_assigned_to_fkey(id, full_name, role)
        `)
        .order('created_at', { ascending: false });

      // Apply filters on server
      if (filterType !== 'all') {
        query = query.eq('lead_type', filterType);
      }

      if (filterAssigned !== 'all') {
        query = query.eq('assigned_to', filterAssigned);
      }

      const minValue = parseFloat(filterMinValue) || 0;
      if (minValue > 0) {
        query = query.gte('estimated_value', minValue);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map assigned_user_name for cards
      const leadsWithUserNames = (data || []).map((lead: any) => ({
        ...lead,
        assigned_user_name: lead.assignee?.full_name || null
      })) as Lead[];

      setLeads(leadsWithUserNames);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      throw error;
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getLeadsByStage = (stage: PipelineStage) => {
    return leads.filter(lead => lead.pipeline_stage === stage);
  };

  const getStageStats = (stage: PipelineStage) => {
    const stageLeads = getLeadsByStage(stage);
    const count = stageLeads.length;
    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    const avgValue = count > 0 ? totalValue / count : 0;

    return { count, totalValue, avgValue };
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedLead) return;

    // Don't update if dropping in same stage
    if (draggedLead.pipeline_stage === targetStage) {
      setDraggedLead(null);
      return;
    }

    // Optimistic update
    const previousLeads = [...leads];
    setLeads(prev => prev.map(lead => 
      lead.id === draggedLead.id 
        ? { ...lead, pipeline_stage: targetStage }
        : lead
    ));

    try {
      // Update lead in database
      const updateData: any = {
        pipeline_stage: targetStage,
        updated_at: new Date().toISOString()
      };

      // Auto-update stage based on pipeline_stage
      if (targetStage === 'closed_won') {
        updateData.stage = 'won';
        updateData.won_date = new Date().toISOString().split('T')[0];
      } else if (targetStage === 'closed_lost') {
        updateData.stage = 'lost';
        updateData.lost_date = new Date().toISOString().split('T')[0];
      } else if (targetStage === 'proposal') {
        updateData.stage = 'proposal';
      } else if (targetStage === 'negotiation') {
        updateData.stage = 'negotiation';
      } else if (targetStage === 'demo') {
        updateData.stage = 'qualified';
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', draggedLead.id);

      if (error) throw error;

      toast.success(`Lead movido a ${PIPELINE_STAGES.find(s => s.value === targetStage)?.label}`);
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast.error('Error al mover el lead');
      // Revert optimistic update
      setLeads(previousLeads);
    } finally {
      setDraggedLead(null);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  const handleMoveStage = async (leadId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Etapa actualizada');
      await loadLeads();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Error al actualizar etapa');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Filters skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Pipeline skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="hot">🔥 Caliente</SelectItem>
              <SelectItem value="warm">🌡️ Templado</SelectItem>
              <SelectItem value="cold">❄️ Frío</SelectItem>
              <SelectItem value="mql">📊 MQL</SelectItem>
              <SelectItem value="sql">💼 SQL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAssigned} onValueChange={setFilterAssigned}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Asignado a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterMinValue} onValueChange={setFilterMinValue}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todos</SelectItem>
              <SelectItem value="1000">€1,000+</SelectItem>
              <SelectItem value="5000">€5,000+</SelectItem>
              <SelectItem value="10000">€10,000+</SelectItem>
              <SelectItem value="25000">€25,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Lead
        </Button>
      </div>

      {/* Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.value);
          const stats = getStageStats(stage.value);
          const isDropTarget = dragOverStage === stage.value;

          return (
            <div
              key={stage.value}
              className={`
                flex flex-col transition-all duration-200
                ${isDropTarget ? 'scale-105' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, stage.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              {/* Column Header */}
              <Card className={`mb-4 ${isDropTarget ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <Badge variant="secondary">{stats.count}</Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    {stage.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{formatCurrency(stats.totalValue)}</span>
                  </div>
                  {stats.count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Promedio:</span>
                      <span className="font-medium">{formatCurrency(stats.avgValue)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lead Cards */}
              <div className={`
                space-y-3 min-h-[200px] p-2 rounded-lg transition-all
                ${isDropTarget ? 'bg-primary/5 border-2 border-dashed border-primary' : ''}
              `}>
                {stageLeads.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                    {isDropTarget ? 'Suelta aquí' : 'Sin leads'}
                  </div>
                ) : (
                  stageLeads.map(lead => (
                    <PipelineLeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={handleDragStart}
                      onClick={handleLeadClick}
                      isDragging={draggedLead?.id === lead.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <CreateLeadModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          loadLeads();
          setCreateModalOpen(false);
        }}
      />

      {selectedLead && (
        <LeadDetailModal
          isOpen={detailModalOpen}
          lead={selectedLead}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLead(null);
          }}
          onUpdate={loadLeads}
          onMoveStage={handleMoveStage}
        />
      )}
    </div>
  );
};

export default PipelineBoard;
