import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lead } from '@/types';
import { Plus, Filter, TrendingUp, Users, Target, ArrowUpRight, Sparkles, GripVertical } from 'lucide-react';
import LeadDetailModal from '@/components/LeadDetailModal';
import CreateLeadModal from '@/components/CreateLeadModal';
import PipelineLeadCard from '@/components/PipelineLeadCard';

// Colores modernos para las etapas con gradientes
const STAGE_COLORS = [
  { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  { bg: 'from-orange-500 to-red-500', light: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  { bg: 'from-emerald-500 to-green-600', light: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  { bg: 'from-rose-500 to-red-600', light: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20', dot: 'bg-rose-500' },
];

interface CustomPipelineStage {
  id: string;
  name: string;
  order_index: number;
  description: string | null;
  colorScheme: typeof STAGE_COLORS[0];
}

const PipelineBoard = () => {
  const { user, currentOrganizationId } = useAuth();

  // State
  const [pipelineStages, setPipelineStages] = useState<CustomPipelineStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; role: string }>>([]);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAssigned, setFilterAssigned] = useState<string>('all');
  const [filterMinValue, setFilterMinValue] = useState<string>('0');

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (user && currentOrganizationId) {
      loadData();
    }
  }, [user, currentOrganizationId, filterType, filterAssigned, filterMinValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPipelineStages(), loadLeads(), loadUsers()]);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      toast.error('Error al cargar el pipeline');
    } finally {
      setLoading(false);
    }
  };

  const loadPipelineStages = async () => {
    try {
      if (!currentOrganizationId) {
        console.error('No organization ID available');
        return;
      }

      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('order_index');

      if (error) throw error;

      const stagesWithColors = (data || []).map((stage, index) => ({
        ...stage,
        colorScheme: STAGE_COLORS[index % STAGE_COLORS.length]
      }));

      setPipelineStages(stagesWithColors);
    } catch (error) {
      console.error('Error loading pipeline stages:', error);
      toast.error('Error al cargar las etapas del pipeline');
    }
  };

  const loadLeads = async () => {
    try {
      if (!currentOrganizationId) return;

      let query = supabase
        .from('leads')
        .select(`
          *,
          creator:users!leads_created_by_fkey(id, full_name, role),
          assignee:users!leads_assigned_to_fkey(id, full_name, role)
        `)
        .eq('organization_id', currentOrganizationId)
        .order('created_at', { ascending: false });

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

      const leadsWithUserNames = (data || []).map((lead) => ({
        ...lead,
        assigned_user_name: lead.assignee?.full_name || null,
        creator: undefined,
        assignee: undefined
      })) as unknown as Lead[];

      setLeads(leadsWithUserNames);
    } catch (error: unknown) {
      console.error('Error loading leads:', error);
      throw error;
    }
  };

  const loadUsers = async () => {
    try {
      if (!currentOrganizationId) return;

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('organization_id', currentOrganizationId);

      if (roleError) throw roleError;

      const userIds = (roleData || []).map(r => r.user_id);
      if (userIds.length === 0) {
        setUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .in('id', userIds)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getLeadsByStage = (stageName: string) => {
    return leads.filter(lead => lead.pipeline_stage === stageName);
  };

  const getStageStats = (stageName: string) => {
    const stageLeads = getLeadsByStage(stageName);
    const count = stageLeads.length;
    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    const avgValue = count > 0 ? totalValue / count : 0;

    return { count, totalValue, avgValue };
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageName);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageName: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedLead) return;

    if (draggedLead.pipeline_stage === targetStageName) {
      setDraggedLead(null);
      return;
    }

    const previousLeads = [...leads];

    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === draggedLead.id
          ? { ...lead, pipeline_stage: targetStageName }
          : lead
      )
    );

    try {
      const targetStageIndex = pipelineStages.findIndex(s => s.name === targetStageName);
      const isLastStage = targetStageIndex === pipelineStages.length - 1;
      const isSecondToLast = targetStageIndex === pipelineStages.length - 2;

      const updateData: Record<string, unknown> = {
        pipeline_stage: targetStageName,
        updated_at: new Date().toISOString()
      };

      if (pipelineStages.length >= 2) {
        if (isLastStage) {
          updateData.stage = 'lost';
          updateData.lost_date = new Date().toISOString().split('T')[0];
        } else if (isSecondToLast) {
          updateData.stage = 'won';
          updateData.won_date = new Date().toISOString().split('T')[0];
        } else {
          updateData.stage = 'qualified';
        }
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', draggedLead.id);

      if (error) throw error;

      toast.success(`Lead movido a ${targetStageName}`);
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast.error('Error al mover el lead');
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

  // Calculate total pipeline stats
  const totalPipelineValue = leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.stage === 'won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            Pipeline de Ventas
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">
            Gestiona y visualiza tu proceso de ventas
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          size="lg"
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          data-action="create-lead"
        >
          <Plus className="h-5 w-5" />
          Nuevo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Leads</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Valor Pipeline</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">{formatCurrency(totalPipelineValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Ganados</p>
                <p className="text-3xl font-bold text-foreground mt-1">{wonLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Conversión</p>
                <p className="text-3xl font-bold text-foreground mt-1">{conversionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Filter className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] bg-background border-border/50">
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
              <SelectTrigger className="w-[160px] bg-background border-border/50">
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
              <SelectTrigger className="w-[130px] bg-background border-border/50">
                <SelectValue placeholder="Valor mínimo" />
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
        </CardContent>
      </Card>

      {/* Pipeline Board */}
      <div id="pipeline-columns" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {pipelineStages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.name);
          const stats = getStageStats(stage.name);
          const isDropTarget = dragOverStage === stage.name;
          const colorScheme = stage.colorScheme;

          return (
            <div
              key={stage.id}
              data-stage={stage.name.toLowerCase().replace(/ /g, '-')}
              className={`
                flex flex-col transition-all duration-300 ease-out pipeline-column
                ${isDropTarget ? 'scale-[1.02]' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              {/* Column Header */}
              <div className={`
                relative overflow-hidden rounded-xl mb-3 transition-all duration-300
                ${isDropTarget ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg' : 'shadow-sm'}
              `}>
                {/* Gradient Header */}
                <div className={`bg-gradient-to-r ${colorScheme.bg} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-white/50" />
                      <Badge 
                        variant="secondary" 
                        className="bg-white/20 text-white border-0 font-bold text-sm px-2.5 shadow-sm"
                      >
                        {stats.count}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-base tracking-tight">
                    {stage.name}
                  </h3>
                  {stage.description && (
                    <p className="text-white/70 text-xs mt-1 line-clamp-1">
                      {stage.description}
                    </p>
                  )}
                </div>
                
                {/* Stats Section */}
                <div className={`${colorScheme.light} p-3 border-x border-b ${colorScheme.border} rounded-b-xl backdrop-blur-sm`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className={`font-bold ${colorScheme.text}`}>
                      {formatCurrency(stats.totalValue)}
                    </span>
                  </div>
                  {stats.count > 0 && (
                    <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-border/30">
                      <span className="text-muted-foreground">Promedio</span>
                      <span className="font-medium text-muted-foreground">
                        {formatCurrency(stats.avgValue)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Cards Container */}
              <div className={`
                flex-1 space-y-3 p-3 rounded-xl transition-all duration-300 min-h-[200px]
                ${isDropTarget 
                  ? `${colorScheme.light} border-2 border-dashed ${colorScheme.border} shadow-inner` 
                  : 'bg-muted/20 border border-border/30 hover:border-border/50'
                }
              `}>
                {stageLeads.length === 0 ? (
                  <div className={`
                    flex flex-col items-center justify-center h-full py-10 
                    text-center rounded-xl transition-all
                    ${isDropTarget ? colorScheme.light : 'bg-muted/30'}
                  `}>
                    <div className={`
                      h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition-all
                      ${isDropTarget ? `${colorScheme.light} shadow-lg` : 'bg-muted'}
                    `}>
                      <Target className={`h-7 w-7 ${isDropTarget ? colorScheme.text : 'text-muted-foreground/40'}`} />
                    </div>
                    <p className={`text-sm font-semibold ${isDropTarget ? colorScheme.text : 'text-muted-foreground/70'}`}>
                      {isDropTarget ? '¡Suelta aquí!' : 'Sin leads'}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-1 max-w-[120px]">
                      {isDropTarget ? 'para mover el lead' : 'Arrastra leads a esta etapa'}
                    </p>
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

      {/* Empty State when no stages */}
      {pipelineStages.length === 0 && (
        <Card className="p-12 text-center border-dashed border-2 bg-muted/10">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
              <Target className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">No hay etapas configuradas</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Configura las etapas de tu pipeline para empezar a gestionar tus leads de forma visual
              </p>
            </div>
            <Button className="mt-2" onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Lead
            </Button>
          </div>
        </Card>
      )}

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