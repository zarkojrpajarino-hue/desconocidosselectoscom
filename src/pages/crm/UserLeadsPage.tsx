import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '@/types';
import { formatDate } from '@/lib/dateUtils';
import { exportLeadsToExcel } from '@/lib/excelUtils';
import LeadDetailModal from '@/components/LeadDetailModal';
import CreateLeadModal from '@/components/CreateLeadModal';

const UserLeadsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    won: 0,
    lost: 0,
    hot: 0,
    pipelineValue: 0,
    wonValue: 0
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserLeads();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserName(data.full_name);
      setUserRole(data.role);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos del usuario');
    }
  };

  const loadUserLeads = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          creator:created_by(id, full_name, role),
          assignee:assigned_to(id, full_name, role)
        `)
        .eq('created_by', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      interface RawLeadData extends Record<string, unknown> {
        assignee?: { full_name?: string };
      }
      const leadsData = ((data || []) as RawLeadData[]).map((lead) => ({
        ...lead,
        assigned_user_name: lead.assignee?.full_name || null
      })) as Lead[];

      setLeads(leadsData);

      // Calcular estadísticas
      const total = leadsData.length;
      const won = leadsData.filter(l => l.stage === 'won').length;
      const lost = leadsData.filter(l => l.stage === 'lost').length;
      const hot = leadsData.filter(l => l.lead_type === 'hot').length;
      const pipelineValue = leadsData.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      const wonValue = leadsData
        .filter(l => l.stage === 'won')
        .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

      setStats({ total, won, lost, hot, pipelineValue, wonValue });
    } catch (error) {
      console.error('Error loading user leads:', error);
      toast.error('Error al cargar leads del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditLead(lead);
    setCreateModalOpen(true);
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
      await loadUserLeads();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Error al actualizar etapa');
    }
  };

  const handleExport = () => {
    exportLeadsToExcel(leads, `leads_${userName.replace(' ', '_')}`);
    toast.success('Leads exportados a Excel');
  };

  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case 'hot': return '🔥';
      case 'warm': return '🌡️';
      case 'cold': return '❄️';
      case 'mql': return '📊';
      case 'sql': return '💼';
      default: return '📌';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-success text-success-foreground';
      case 'lost': return 'bg-destructive text-destructive-foreground';
      case 'negotiation': return 'bg-warning text-warning-foreground';
      case 'proposal': return 'bg-blue-500 text-white';
      case 'qualified': return 'bg-purple-500 text-white';
      case 'contacted': return 'bg-cyan-500 text-white';
      case 'new': return 'bg-muted text-muted-foreground';
      case 'lead': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isOwnLeads = currentUser?.id === userId;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">
                {isOwnLeads ? '🌟 Tus Leads' : `Leads de ${userName}`}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground capitalize truncate">
                {userRole} • {stats.total} leads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3"
              disabled={leads.length === 0}
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Exportar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/crm')}
              className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Volver</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl space-y-4 md:space-y-6">
        {/* Estadísticas */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4 md:pb-0 md:overflow-visible -mx-3 px-3 md:mx-0 md:px-0">
          <Card className="min-w-[120px] flex-shrink-0 md:min-w-0 md:flex-shrink">
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ganados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{stats.won}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Perdidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{stats.lost}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">🔥 {stats.hot}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">€{stats.pipelineValue.toFixed(0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Ganado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">€{stats.wonValue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Leads */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Listado de Leads</CardTitle>
            <CardDescription>
              {isOwnLeads 
                ? 'Todos los leads que has creado'
                : `Todos los leads creados por ${userName}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {isOwnLeads 
                  ? 'Aún no has creado ningún lead. ¡Empieza a añadir leads desde el CRM principal!'
                  : `${userName} aún no ha creado ningún lead.`
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Nombre</th>
                      <th className="pb-3 font-medium">Empresa</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Valor</th>
                      <th className="pb-3 font-medium">Prob.</th>
                      <th className="pb-3 font-medium">Fecha Creación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                          </div>
                        </td>
                        <td className="py-3">{lead.company || '-'}</td>
                        <td className="py-3">
                          <span className="text-xl" title={lead.lead_type}>
                            {getLeadTypeIcon(lead.lead_type)}
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge className={getStatusColor(lead.stage)} variant="secondary">
                            {lead.stage}
                          </Badge>
                        </td>
                        <td className="py-3 font-medium">
                          {lead.estimated_value ? `€${lead.estimated_value.toFixed(0)}` : '-'}
                        </td>
                        <td className="py-3">
                          <span className="text-sm">{lead.probability}%</span>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {formatDate(lead.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modales */}
      {selectedLead && (
        <LeadDetailModal
          isOpen={detailModalOpen}
          lead={selectedLead}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLead(null);
          }}
          onUpdate={loadUserLeads}
          onMoveStage={handleMoveStage}
        />
      )}

      <CreateLeadModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditLead(null);
        }}
        onSuccess={() => {
          loadUserLeads();
          setCreateModalOpen(false);
          setEditLead(null);
        }}
        editLead={editLead}
      />
    </div>
  );
};

export default UserLeadsPage;
