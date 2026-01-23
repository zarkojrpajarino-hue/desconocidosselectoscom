import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { leadSchema, LeadFormData } from '@/lib/validation';
import { Lead } from '@/types';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useBackendValidation } from '@/hooks/useBackendValidation';
import { UpgradeModal } from '@/components/UpgradeModal';
import { logger } from '@/lib/logger';
import { handleError } from '@/utils/errorHandler';
import { ChevronDown, Target, DollarSign, UserCheck, Clock, X } from 'lucide-react';

interface ProductService {
  name: string;
  price?: number;
  category?: string;
  description?: string;
}

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editLead?: Lead;
}

const CreateLeadModal = ({ isOpen, onClose, onSuccess, editLead }: CreateLeadModalProps) => {
  const { user, currentOrganizationId } = useAuth();
  const { canAddLead, plan, leadCount, limits } = useSubscriptionLimits();
  const { canAddLead: validateBackend, validating } = useBackendValidation();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [organizationProducts, setOrganizationProducts] = useState<ProductService[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    estimated_value: '',
    probability: '50',
    stage: 'lead',
    priority: 'medium',
    source: 'website',
    assigned_to: user?.id || '',
    next_action: '',
    next_action_date: '',
    interested_products: [] as string[],
    notes: '',
    // BANT Fields
    budget_confirmed: false,
    budget_amount: '',
    authority_level: 'unknown',
    need_level: '5',
    timeline_date: '',
    competitors: [] as string[],
    main_objection: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchOrganizationProducts();
    if (editLead) {
      const leadAny = editLead as unknown as Record<string, unknown>;
      setFormData({
        name: editLead.name || '',
        company: editLead.company || '',
        email: editLead.email || '',
        phone: editLead.phone || '',
        estimated_value: editLead.estimated_value?.toString() || '',
        probability: editLead.probability?.toString() || '50',
        stage: editLead.stage || 'lead',
        priority: editLead.priority || 'medium',
        source: editLead.source || 'website',
        assigned_to: editLead.assigned_to || user?.id || '',
        next_action: editLead.next_action || '',
        next_action_date: editLead.next_action_date || '',
        interested_products: editLead.interested_products || [],
        notes: editLead.notes || '',
        // BANT Fields
        budget_confirmed: Boolean(leadAny.budget_confirmed) || false,
        budget_amount: String(leadAny.budget_amount || ''),
        authority_level: String(leadAny.authority_level || 'unknown'),
        need_level: String(leadAny.need_level || '5'),
        timeline_date: String(leadAny.timeline_date || ''),
        competitors: Array.isArray(leadAny.competitors) ? leadAny.competitors as string[] : [],
        main_objection: String(leadAny.main_objection || '')
      });
    }
  }, [editLead, user, currentOrganizationId]);

  const fetchOrganizationProducts = async () => {
    if (!currentOrganizationId) return;
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('products_services')
        .eq('id', currentOrganizationId)
        .single();
      
      if (error) {
        logger.error('Error fetching organization products:', error);
        return;
      }
      
      // Parse products_services from organization
      const rawProducts = data?.products_services;
      if (Array.isArray(rawProducts)) {
        const parsed = rawProducts.map((p: unknown) => {
          const item = p as Record<string, unknown>;
          return {
            name: String(item.name || ''),
            price: item.price ? Number(item.price) : undefined,
            category: item.category ? String(item.category) : undefined,
            description: item.description ? String(item.description) : undefined,
          };
        }).filter(p => p.name);
        setOrganizationProducts(parsed);
      } else {
        setOrganizationProducts([]);
      }
    } catch (err) {
      handleError(err, 'Error al cargar productos de la organización');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .order('full_name');
      
      if (error) {
        logger.error('Error fetching users:', error);
        toast.error('Error al cargar usuarios');
        return;
      }
      
      setUsers(data || []);
    } catch (err) {
      handleError(err, 'Error inesperado al cargar usuarios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Verificar límite de leads (solo para nuevos leads, no ediciones)
    if (!editLead) {
      // Validación frontend primero (rápida)
      const { allowed } = canAddLead();
      if (!allowed) {
        setShowUpgradeModal(true);
        return;
      }
      
      // Validación backend (segura)
      const backendValidation = await validateBackend();
      if (!backendValidation.allowed) {
        toast.error(backendValidation.message || 'Has alcanzado el límite de leads de tu plan');
        setShowUpgradeModal(true);
        return;
      }
    }
    
    // Validar con Zod
    const validation = leadSchema.safeParse({
      name: formData.name,
      company: formData.company || null,
      email: formData.email || null,
      phone: formData.phone || null,
      estimated_value: parseFloat(formData.estimated_value) || 0,
      probability: parseInt(formData.probability) || 50,
      notes: formData.notes || null,
    });

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof LeadFormData, string>> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LeadFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      // MULTI-TENANCY: Include organization_id
      const leadData = {
        name: formData.name.trim(),
        company: formData.company.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        estimated_value: parseFloat(formData.estimated_value) || 0,
        probability: parseInt(formData.probability) || 50,
        stage: formData.stage,
        priority: formData.priority,
        source: formData.source || null,
        assigned_to: formData.assigned_to || user?.id,
        next_action: formData.next_action.trim() || null,
        next_action_date: formData.next_action_date || null,
        interested_products: formData.interested_products.length > 0 ? formData.interested_products : null,
        notes: formData.notes.trim() || null,
        last_contact_date: new Date().toISOString().split('T')[0],
        created_by: user?.id,
        organization_id: currentOrganizationId,
        // BANT Fields
        budget_confirmed: formData.budget_confirmed,
        budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : null,
        authority_level: formData.authority_level,
        need_level: parseInt(formData.need_level) || 5,
        timeline_date: formData.timeline_date || null,
        competitors: formData.competitors.length > 0 ? formData.competitors : null,
        main_objection: formData.main_objection.trim() || null
      };

      if (editLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editLead.id);
        
        if (error) {
          logger.error('Error updating lead:', error);
          throw error;
        }
        
        toast.success('Lead actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);
        
        if (error) {
          logger.error('Error creating lead:', error);
          throw error;
        }
        
        toast.success('Lead creado correctamente');
      }

      onSuccess();
      onClose();
    } catch (error) {
      handleError(error, 'Error al guardar lead');
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (product: string) => {
    setFormData(prev => ({
      ...prev,
      interested_products: prev.interested_products.includes(product)
        ? prev.interested_products.filter(p => p !== product)
        : [...prev.interested_products, product]
    }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editLead ? 'Editar Lead' : 'Nuevo Lead'}</DialogTitle>
            <DialogDescription>
              {editLead ? 'Actualiza la información del lead' : 'Completa la información para crear un nuevo lead'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="María González"
                  required
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Hotel Boutique"
                  className={errors.company ? 'border-destructive' : ''}
                />
                {errors.company && (
                  <p className="text-xs text-destructive mt-1">{errors.company}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="maria@hotel.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 666 123 456"
                />
              </div>

              <div>
                <Label htmlFor="source">Origen</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="referral">Referido</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Teléfono</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage">Etapa</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
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
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimated_value">Valor Estimado (€)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  step="0.01"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="2400"
                />
              </div>

              <div>
                <Label htmlFor="probability">Probabilidad (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="assigned_to">Asignado a</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Productos/Servicios de Interés</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {organizationProducts.length > 0 ? (
                  organizationProducts.map(product => (
                    <Button
                      key={product.name}
                      type="button"
                      size="sm"
                      variant={formData.interested_products.includes(product.name) ? 'default' : 'outline'}
                      onClick={() => handleProductToggle(product.name)}
                      title={product.price ? `€${product.price}` : undefined}
                    >
                      {product.name}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay productos/servicios configurados. Configúralos en el onboarding o contacta al administrador.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="next_action">Próxima Acción</Label>
                <Input
                  id="next_action"
                  value={formData.next_action}
                  onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                  placeholder="Llamar para seguimiento"
                />
              </div>

              <div>
                <Label htmlFor="next_action_date">Fecha</Label>
                <Input
                  id="next_action_date"
                  type="date"
                  value={formData.next_action_date}
                  onChange={(e) => setFormData({ ...formData, next_action_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional..."
                rows={3}
              />
            </div>

            {/* BANT Qualification Section */}
            <Collapsible className="border rounded-lg p-3 bg-muted/30">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Calificación BANT</span>
                  <Badge variant="secondary" className="text-xs">Opcional</Badge>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <p className="text-xs text-muted-foreground mb-3">
                  BANT te ayuda a calificar leads: Budget (Presupuesto), Authority (Decisor), Need (Necesidad), Timeline (Urgencia)
                </p>
                
                {/* Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="budget_confirmed"
                      checked={formData.budget_confirmed}
                      onCheckedChange={(checked) => setFormData({ ...formData, budget_confirmed: checked === true })}
                    />
                    <Label htmlFor="budget_confirmed" className="text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Presupuesto confirmado
                    </Label>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Monto del presupuesto (€)"
                      value={formData.budget_amount}
                      onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                      disabled={!formData.budget_confirmed}
                    />
                  </div>
                </div>

                {/* Authority */}
                <div>
                  <Label className="text-sm flex items-center gap-1 mb-2">
                    <UserCheck className="h-3 w-3" />
                    Nivel de autoridad
                  </Label>
                  <Select 
                    value={formData.authority_level} 
                    onValueChange={(value) => setFormData({ ...formData, authority_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Desconocido</SelectItem>
                      <SelectItem value="decisor">Decisor final</SelectItem>
                      <SelectItem value="influencer">Influenciador</SelectItem>
                      <SelectItem value="user">Usuario final</SelectItem>
                      <SelectItem value="gatekeeper">Gatekeeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Need */}
                <div>
                  <Label className="text-sm flex items-center gap-1 mb-2">
                    <Target className="h-3 w-3" />
                    Nivel de necesidad (1-10)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.need_level}
                    onChange={(e) => setFormData({ ...formData, need_level: e.target.value })}
                  />
                </div>

                {/* Timeline */}
                <div>
                  <Label className="text-sm flex items-center gap-1 mb-2">
                    <Clock className="h-3 w-3" />
                    Fecha objetivo de decisión
                  </Label>
                  <Input
                    type="date"
                    value={formData.timeline_date}
                    onChange={(e) => setFormData({ ...formData, timeline_date: e.target.value })}
                  />
                </div>

                {/* Competitors */}
                <div>
                  <Label className="text-sm mb-2">Competidores considerados</Label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {formData.competitors.map((comp, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {comp}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setFormData({
                            ...formData,
                            competitors: formData.competitors.filter((_, i) => i !== idx)
                          })}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Escribe y presiona Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        if (value && !formData.competitors.includes(value)) {
                          setFormData({
                            ...formData,
                            competitors: [...formData.competitors, value]
                          });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>

                {/* Main Objection */}
                <div>
                  <Label className="text-sm mb-2">Principal objeción</Label>
                  <Textarea
                    value={formData.main_objection}
                    onChange={(e) => setFormData({ ...formData, main_objection: e.target.value })}
                    placeholder="¿Cuál es la principal barrera u objeción del cliente?"
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                data-action="close-modal"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : editLead ? 'Actualizar' : 'Crear Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="leads"
        currentValue={leadCount}
        limitValue={limits.max_leads_per_month}
      />
    </>
  );
};

export default CreateLeadModal;
