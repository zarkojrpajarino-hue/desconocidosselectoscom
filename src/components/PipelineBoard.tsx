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
import { Lead } from '@/types';
import { Plus, Filter } from 'lucide-react';
import LeadDetailModal from '@/components/LeadDetailModal';
import CreateLeadModal from '@/components/CreateLeadModal';
import PipelineLeadCard from '@/components/PipelineLeadCard';

// Colores para las etapas basados en orden
const STAGE_COLORS = [
  'bg-blue-500',
  'bg-purple-500', 
  'bg-yellow-500',
  'bg-orange-500',
  'bg-green-500',
  'bg-red-500'
];

interface CustomPipelineStage {
  id: string;
  name: string;
  order_index: number;
  description: string | null;
  color: string;
}

const PipelineBoard = () => {
  const { user, currentOrganizationId } = useAuth();
  const navigate = useNavigate();

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

      // Obtener las etapas personalizadas de la organización
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('order_index');

      if (error) throw error;

      // Mapear etapas con colores
      const stagesWithColors = (data || []).map((stage, index) => ({
        ...stage,
        color: STAGE_COLORS[index % STAGE_COLORS.length]
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
      const leadsWithUserNames = (data || []).map((lead) => ({
        ...lead,
        assigned_user_name: lead.assignee?.full_name || null,
        // Remove nested objects to match Lead type
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

      // Obtener usuarios de la organización actual via user_roles
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

    // Don't update if dropping in same stage
    if (draggedLead.pipeline_stage === targetStageName) {
      setDraggedLead(null);
      return;
    }

    // Optimistic update
    const previousLeads = [...leads];
    setLeads(prev => prev.map(lead => 
      lead.id === draggedLead.id 
        ? { ...lead, pipeline_stage: targetStageName }
        : lead
    ));

    try {
      // Update lead in database
      const updateData: {
        pipeline_stage: string;
        updated_at: string;
        stage?: string;
        lost_date?: string;
        won_date?: string;
      } = {
        pipeline_stage: targetStageName,
        updated_at: new Date().toISOString()
      };

      // Determinar stage automáticamente según la etapa del pipeline
      const targetStage = pipelineStages.find(s => s.name === targetStageName);
      if (targetStage) {
        const isLastStage = targetStage.order_index === pipelineStages.length - 1;
        const isSecondToLast = targetStage.order_index === pipelineStages.length - 2;

        if (isLastStage) {
          // Última etapa = Perdido
          updateData.stage = 'lost';
          updateData.lost_date = new Date().toISOString().split('T')[0];
        } else if (isSecondToLast) {
          // Penúltima etapa = Ganado
          updateData.stage = 'won';
          updateData.won_date = new Date().toISOString().split('T')[0];
        } else {
          // Otras etapas = en proceso
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
      {/* Nuevo Lead Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-2"
          data-action="create-lead"
        >
          <Plus className="h-4 w-4" />
          Nuevo Lead
        </Button>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtrar por:</span>
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
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMinValue} onValueChange={setFilterMinValue}>
              <SelectTrigger className="w-[120px]">
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
      <div id="pipeline-columns" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {pipelineStages.map(stage => {
          const stageLeads = getLeadsByStage(stage.name);
          const stats = getStageStats(stage.name);
          const isDropTarget = dragOverStage === stage.name;

          return (
            <div
              key={stage.id}
              data-stage={stage.name.toLowerCase().replace(/ /g, '-')}
              className={`
                flex flex-col transition-all duration-200 pipeline-column
                ${isDropTarget ? 'scale-105' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              {/* Column Header */}
              <Card className={`mb-4 ${isDropTarget ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <Badge variant="secondary">{stats.count}</Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    {stage.name}
                  </CardTitle>
                  {stage.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stage.description}
                    </p>
                  )}
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
