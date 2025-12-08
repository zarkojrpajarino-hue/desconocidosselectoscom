import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Lead } from '@/types';
import { 
  Building2, Mail, Phone, Calendar, Euro, TrendingUp, User, Edit, 
  MessageSquare, PhoneCall, Video, Send, FileText, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import CreateLeadModal from '@/components/CreateLeadModal';

interface LeadInteraction {
  id: string;
  lead_id: string;
  interaction_type: string;
  subject: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface LeadDetailModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onUpdate: () => void;
  onMoveStage: (leadId: string, stage: string) => void;
}

const LeadDetailModal = ({ isOpen, lead, onClose, onUpdate, onMoveStage }: LeadDetailModalProps) => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'call',
    subject: '',
    description: ''
  });

  useEffect(() => {
    if (lead) {
      fetchInteractions();
    }
  }, [lead]);

  const fetchInteractions = async () => {
    if (!lead) return;
    const { data } = await supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    
    setInteractions((data as LeadInteraction[]) || []);
  };

  const handleAddInteraction = async () => {
    if (!lead) return;
    if (!newInteraction.subject.trim()) {
      toast.error('El asunto es obligatorio');
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_interactions')
        .insert([{
          lead_id: lead.id,
          interaction_type: newInteraction.type,
          subject: newInteraction.subject,
          description: newInteraction.description,
          created_by: user?.id
        }]);

      if (error) throw error;

      await supabase
        .from('leads')
        .update({ last_contact_date: new Date().toISOString().split('T')[0] })
        .eq('id', lead.id);

      toast.success('Interacción registrada');
      setNewInteraction({ type: 'call', subject: '', description: '' });
      fetchInteractions();
      onUpdate();
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast.error('Error al registrar interacción');
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call': return PhoneCall;
      case 'email': return Mail;
      case 'meeting': return Video;
      case 'whatsapp': return MessageSquare;
      case 'proposal_sent': return Send;
      case 'note': return FileText;
      default: return MessageSquare;
    }
  };

  const getInteractionLabel = (type: string) => {
    const labels: Record<string, string> = {
      call: 'Llamada', email: 'Email', meeting: 'Reunión',
      whatsapp: 'WhatsApp', instagram_dm: 'Instagram DM',
      proposal_sent: 'Propuesta', follow_up: 'Seguimiento',
      note: 'Nota', stage_change: 'Cambio de Etapa'
    };
    return labels[type] || type;
  };

  if (!lead) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{lead.name}</DialogTitle>
                {lead.company && (
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Building2 className="w-4 h-4" />
                    <span>{lead.company}</span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)} className="gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="interactions">Interacciones ({interactions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">Contacto</h3>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                    </div>
                  )}
                  {lead.assigned_to_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Asignado: {lead.assigned_to_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Euro className="w-4 h-4 text-success" />
                      <span className="text-sm text-muted-foreground">Valor Estimado</span>
                    </div>
                    <p className="text-2xl font-bold text-success">{formatCurrency(lead.estimated_value)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Probabilidad</span>
                    </div>
                    <p className="text-2xl font-bold">{lead.probability ?? 0}%</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esperado: {formatCurrency(lead.expected_revenue)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Cambiar Etapa</h3>
                  <Select value={lead.stage} onValueChange={(value) => onMoveStage(lead.id, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="qualified">Calificado</SelectItem>
                      <SelectItem value="proposal">Propuesta</SelectItem>
                      <SelectItem value="negotiation">Negociación</SelectItem>
                      <SelectItem value="won">Ganado</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {lead.interested_products && lead.interested_products.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Productos de Interés</h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.interested_products.map((product: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{product}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {lead.notes && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Notas</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">Registrar Interacción</h3>
                  
                  <Select value={newInteraction.type} onValueChange={(value) => setNewInteraction({ ...newInteraction, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Llamada</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Reunión</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram_dm">Instagram DM</SelectItem>
                      <SelectItem value="proposal_sent">Propuesta</SelectItem>
                      <SelectItem value="follow_up">Seguimiento</SelectItem>
                      <SelectItem value="note">Nota</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Asunto"
                    value={newInteraction.subject}
                    onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                  />

                  <Textarea
                    placeholder="Descripción (opcional)"
                    value={newInteraction.description}
                    onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                    rows={3}
                  />

                  <Button onClick={handleAddInteraction} className="w-full">
                    Registrar
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h3 className="font-semibold">Historial</h3>
                {interactions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      Sin interacciones
                    </CardContent>
                  </Card>
                ) : (
                  interactions.map((interaction) => {
                    const Icon = getInteractionIcon(interaction.interaction_type);
                    return (
                      <Card key={interaction.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-sm">{interaction.subject}</h4>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {getInteractionLabel(interaction.interaction_type)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {new Date(interaction.created_at).toLocaleDateString('es-ES')}
                                </div>
                              </div>
                              {interaction.description && (
                                <p className="text-sm text-muted-foreground mt-2">{interaction.description}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showEditModal && lead && (
        <CreateLeadModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
          editLead={lead}
        />
      )}
    </>
  );
};

export default LeadDetailModal;
