import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Download, Plus, Search, TrendingUp, Users, DollarSign, Target, User, ExternalLink, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { toast } from 'sonner';
import { Lead, UserLeadStats, CRMGlobalStats } from '@/types';
import { formatDate } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/currencyUtils';
import { exportLeadsToExcel, exportUserStatsToExcel } from '@/lib/excelUtils';
import { useLeads } from '@/hooks/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingTable, LoadingSkeleton } from '@/components/ui/loading-skeleton';
import CreateLeadModal from '@/components/CreateLeadModal';
import LeadDetailModal from '@/components/LeadDetailModal';
import { SectionTourButton } from '@/components/SectionTourButton';
import { IntegrationButton } from '@/components/IntegrationButton';

const CRMPage = () => {
  const { user, userProfile, currentOrganizationId, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Use custom hook for leads data with organization filtering
  const { 
    leads, 
    userStats, 
    globalStats, 
    loading, 
    refetch,
  } = useLeads(user?.id, currentOrganizationId);

  // State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  // Filters with debounce
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCreatedBy, setFilterCreatedBy] = useState<string>('all');

  // Collapsibles
  const [leadsTableOpen, setLeadsTableOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  // Virtual scrolling ref
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Memoized filtered leads for performance
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Búsqueda por texto
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(search) ||
        lead.company?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.phone?.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.stage === filterStatus);
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(lead => lead.lead_type === filterType);
    }

    // Filtro por creador
    if (filterCreatedBy !== 'all') {
      filtered = filtered.filter(lead => lead.created_by === filterCreatedBy);
    }

    return filtered;
  }, [leads, debouncedSearch, filterStatus, filterType, filterCreatedBy]);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: filteredLeads.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  }, []);

  const handleEditLead = useCallback((lead: Lead) => {
    setEditLead(lead);
    setCreateModalOpen(true);
  }, []);

  const handleMoveStage = useCallback(async (leadId: string, newStage: string) => {
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
      await refetch();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Error al actualizar etapa');
    }
  }, [refetch]);

  const handleExportLeads = useCallback(() => {
    exportLeadsToExcel(filteredLeads, 'crm_leads');
    toast.success('Leads exportados a Excel');
  }, [filteredLeads]);

  const handleExportStats = useCallback(() => {
    exportUserStatsToExcel(userStats, 'crm_user_stats');
    toast.success('Estadísticas exportadas a Excel');
  }, [userStats]);

  const getLeadTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'hot': return '🔥';
      case 'warm': return '🌡️';
      case 'cold': return '❄️';
      case 'mql': return '📊';
      case 'sql': return '💼';
      default: return '📌';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'won': return 'bg-success text-success-foreground';
      case 'lost': return 'bg-destructive text-destructive-foreground';
      case 'negotiation': return 'bg-warning text-warning-foreground';
      case 'proposal': return 'bg-primary/80 text-primary-foreground';
      case 'qualified': return 'bg-accent/80 text-accent-foreground';
      case 'contacted': return 'bg-secondary text-secondary-foreground';
      case 'new': return 'bg-muted text-muted-foreground';
      case 'lead': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  // Memoized user stats
  const currentUserStats = useMemo(() => 
    userStats.find(s => s.user_id === user?.id), 
    [userStats, user?.id]
  );
  
  const otherUsersStats = useMemo(() => 
    userStats.filter(s => s.user_id !== user?.id), 
    [userStats, user?.id]
  );


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando CRM...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CRM Profesional - Pipeline de Leads
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema global de gestión de leads del equipo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SectionTourButton sectionId="crm-hub" />
            
            {/* Notificar en Slack */}
            <IntegrationButton
              type="slack"
              action="notify"
              data={{
                message: `📊 *Resumen CRM*\n\n` +
                  `👥 Total leads: ${globalStats?.total_leads || 0}\n` +
                  `💰 Pipeline: €${globalStats?.total_pipeline_value?.toLocaleString() || 0}\n` +
                  `🔥 Leads calientes: ${globalStats?.hot_leads || 0}\n` +
                  `✅ Ganados: ${globalStats?.won_leads || 0}`,
                channel: '#sales'
              }}
              label="Slack"
              size="sm"
              variant="outline"
            />
            
            <Button
              variant="outline"
              onClick={handleExportLeads}
              className="gap-2"
              disabled={filteredLeads.length === 0}
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Exportar CSV</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/metrics')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Volver</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Botones prominentes Pipeline y CRM Hub */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-y border-emerald-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-foreground">Pipeline de Ventas</h3>
                <p className="text-sm text-muted-foreground">Visualiza el embudo de conversión completo con drag & drop</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/crm/hub')}
                variant="outline"
                className="gap-2 border-primary/50 hover:bg-primary/10"
              >
                <Target className="h-4 w-4" />
                CRM Analytics
              </Button>
              <Button
                onClick={() => navigate('/crm/pipeline')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Ver Pipeline
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* KPIs Globales con StatCards */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              variant="primary"
              size="md"
              value={globalStats.total_leads}
              label="Total Leads"
              change="este mes"
              trend="neutral"
              icon={<Users className="w-5 h-5 text-primary" />}
              className="animate-fade-in"
            />
            
            <StatCard
              variant="success"
              size="md"
              value={`€${globalStats.total_pipeline_value.toLocaleString()}`}
              label="Pipeline Total"
              change="valor acumulado"
              trend="up"
              icon={<DollarSign className="w-5 h-5 text-success" />}
              className="animate-fade-in"
              style={{ animationDelay: '100ms' }}
            />
            
            <StatCard
              variant="warning"
              size="md"
              value={globalStats.hot_leads}
              label="Leads Calientes"
              change="alta prioridad"
              trend={globalStats.hot_leads > 5 ? "up" : "neutral"}
              icon={<span className="text-lg">🔥</span>}
              className="animate-fade-in"
              style={{ animationDelay: '200ms' }}
            />
            
            <StatCard
              variant="success"
              size="md"
              value={globalStats.won_leads}
              label="Ganados"
              change={`${globalStats.total_leads > 0 ? Math.round((globalStats.won_leads / globalStats.total_leads) * 100) : 0}% conversión`}
              trend="up"
              icon={<Target className="w-5 h-5 text-success" />}
              className="animate-fade-in"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Gestión de Leads</h2>
            <p className="text-sm text-muted-foreground">
              Filtra y organiza tus contactos
            </p>
          </div>
          <Button
            onClick={() => {
              setEditLead(null);
              setCreateModalOpen(true);
            }}
            className="bg-gradient-primary gap-2"
            id="crm-new-lead-button"
          >
            <Plus className="h-4 w-4" />
            Nuevo Lead
          </Button>
        </div>
        
        <Card id="crm-filters-card">
          <CardHeader>
            <CardTitle>Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, empresa, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="qualified">Calificado</SelectItem>
                  <SelectItem value="proposal">Propuesta</SelectItem>
                  <SelectItem value="negotiation">Negociación</SelectItem>
                  <SelectItem value="won">Ganado</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
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

              <Select value={filterCreatedBy} onValueChange={setFilterCreatedBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Creado por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {userStats.map(stat => (
                    <SelectItem key={stat.user_id} value={stat.user_id}>
                      {stat.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Leads */}
        <Card>
          <CardHeader>
            <Collapsible open={leadsTableOpen} onOpenChange={setLeadsTableOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      📋 Leads del Equipo ({filteredLeads.length})
                    </CardTitle>
                    <CardDescription>
                      Todos los leads registrados por el equipo
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    {leadsTableOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar tabla
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver tabla completa
                      </>
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4">
                  {/* Header row */}
                  <div className="grid grid-cols-8 gap-4 border-b pb-3 text-sm text-muted-foreground font-medium">
                    <div>Nombre</div>
                    <div>Empresa</div>
                    <div>Tipo</div>
                    <div>Estado</div>
                    <div>Valor</div>
                    <div>Prob.</div>
                    <div>Creado por</div>
                    <div>Fecha</div>
                  </div>
                  
                  {filteredLeads.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No se encontraron leads
                    </div>
                  ) : (
                    <div
                      ref={tableContainerRef}
                      className="h-[400px] overflow-auto"
                    >
                      <div
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                          width: '100%',
                          position: 'relative',
                        }}
                      >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const lead = filteredLeads[virtualRow.index];
                          return (
                            <div
                              key={lead.id}
                              className="grid grid-cols-8 gap-4 items-center border-b hover:bg-muted/50 cursor-pointer transition-colors absolute top-0 left-0 w-full"
                              style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              onClick={() => handleLeadClick(lead)}
                            >
                              <div className="py-3">
                                <p className="font-medium truncate">{lead.name}</p>
                                {lead.email && <p className="text-xs text-muted-foreground truncate">{lead.email}</p>}
                              </div>
                              <div className="py-3 truncate">{lead.company || '-'}</div>
                              <div className="py-3">
                                <span className="text-xl" title={lead.lead_type}>
                                  {getLeadTypeIcon(lead.lead_type)}
                                </span>
                              </div>
                              <div className="py-3">
                                <Badge className={getStatusColor(lead.stage)} variant="secondary">
                                  {lead.stage}
                                </Badge>
                              </div>
                              <div className="py-3 font-medium">
                                {lead.estimated_value ? `€${lead.estimated_value.toFixed(0)}` : '-'}
                              </div>
                              <div className="py-3">
                                <span className="text-sm">{lead.probability}%</span>
                              </div>
                              <div className="py-3">
                                <span className="text-sm truncate">{lead.creator?.full_name || 'N/A'}</span>
                              </div>
                              <div className="py-3 text-sm text-muted-foreground">
                                {formatDate(lead.created_at)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* SECCIÓN INDIVIDUAL - Estadísticas por Usuario */}
        <Card className="bg-gradient-to-br from-card via-card/95 to-primary/5">
          <CardHeader>
            <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      👥 ESTADÍSTICAS INDIVIDUALES
                    </CardTitle>
                    <CardDescription>
                      Rendimiento de cada miembro del equipo
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    {statsOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar estadísticas
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver estadísticas
                      </>
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-6 mt-4" id="crm-individual-stats">
                  {/* TU TARJETA (Destacada) */}
                  {currentUserStats && (
                    <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-primary/10 via-card to-card">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-xl font-bold">🌟 TÚ - {currentUserStats.full_name}</p>
                              <p className="text-sm text-muted-foreground capitalize">{currentUserStats.role}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(`/crm/user/${currentUserStats.user_id}`)}
                            className="gap-2"
                          >
                            Ver tus leads
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{currentUserStats.total_leads}</p>
                            <p className="text-sm text-muted-foreground">Leads Totales</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-success">{currentUserStats.won_leads}</p>
                            <p className="text-sm text-muted-foreground">Ganados</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-warning">{currentUserStats.hot_leads}</p>
                            <p className="text-sm text-muted-foreground">Calientes 🔥</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-emerald-600">€{currentUserStats.total_won_value.toFixed(0)}</p>
                            <p className="text-sm text-muted-foreground">Valor Ganado</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Otros Miembros del Equipo */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Otros miembros del equipo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {otherUsersStats.map((stat) => (
                        <Card
                          key={stat.user_id}
                          className="hover:shadow-lg hover:border-primary/50 transition-all"
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                              <span>{stat.full_name}</span>
                            </CardTitle>
                            <CardDescription className="capitalize">{stat.role}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">📊 Total leads:</span>
                                  <span className="font-bold">{stat.total_leads}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">✅ Ganados:</span>
                                  <span className="font-bold text-success">{stat.won_leads}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">🔥 Calientes:</span>
                                  <span className="font-bold text-warning">{stat.hot_leads}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/crm/user/${stat.user_id}`)}
                                className="w-full gap-2"
                              >
                                Ver leads añadidos por {stat.full_name.split(' ')[0]}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Botón exportar estadísticas */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleExportStats}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Exportar Estadísticas
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
         </Card>
      </main>

      {/* Modales */}
      <CreateLeadModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditLead(null);
        }}
        onSuccess={() => {
          refetch();
          setCreateModalOpen(false);
          setEditLead(null);
        }}
        editLead={editLead}
      />

      {selectedLead && (
        <LeadDetailModal
          isOpen={detailModalOpen}
          lead={selectedLead}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLead(null);
          }}
          onUpdate={refetch}
          onMoveStage={handleMoveStage}
        />
      )}
    </div>
  );
};

export default CRMPage;
