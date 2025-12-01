import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { leadSchema, LeadFormData } from '@/lib/validation';
import { Lead } from '@/types';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editLead?: Lead;
}

const CreateLeadModal = ({ isOpen, onClose, onSuccess, editLead }: CreateLeadModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});

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
    notes: ''
  });

  useEffect(() => {
    fetchUsers();
    if (editLead) {
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
        notes: editLead.notes || ''
      });
    }
  }, [editLead, user]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .order('full_name');
      
      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Error al cargar usuarios');
        return;
      }
      
      setUsers(data || []);
    } catch (err: any) {
      console.error('Unexpected error fetching users:', err);
      toast.error('Error inesperado al cargar usuarios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
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
        created_by: user?.id
      };

      if (editLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editLead.id);
        
        if (error) {
          console.error('Error updating lead:', error);
          throw error;
        }
        
        toast.success('Lead actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);
        
        if (error) {
          console.error('Error creating lead:', error);
          throw error;
        }
        
        toast.success('Lead creado correctamente');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving lead:', error);
      toast.error('Error al guardar lead', {
        description: error.message || 'Intenta de nuevo más tarde',
      });
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
            <Label>Productos de Interés</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['premium', 'personalizadas', 'estandar', 'basicas', 'corporativas'].map(product => (
                <Button
                  key={product}
                  type="button"
                  size="sm"
                  variant={formData.interested_products.includes(product) ? 'default' : 'outline'}
                  onClick={() => handleProductToggle(product)}
                >
                  {product}
                </Button>
              ))}
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

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : editLead ? 'Actualizar' : 'Crear Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadModal;