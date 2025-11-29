import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MarketingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MarketingFormModal = ({ open, onOpenChange, onSuccess }: MarketingFormModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    channel: 'instagram',
    amount: '',
    leads_generated: '0',
    conversions: '0',
    revenue_generated: '0',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('marketing_spend').insert({
        date: formData.date,
        channel: formData.channel,
        amount: parseFloat(formData.amount),
        leads_generated: parseInt(formData.leads_generated),
        conversions: parseInt(formData.conversions),
        revenue_generated: parseFloat(formData.revenue_generated),
        notes: formData.notes || null,
        created_by: user?.id
      });

      if (error) throw error;

      toast.success('Campaña de marketing registrada exitosamente');
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        channel: 'instagram',
        amount: '',
        leads_generated: '0',
        conversions: '0',
        revenue_generated: '0',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating marketing entry:', error);
      toast.error('Error al registrar campaña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Campaña de Marketing de la Empresa</DialogTitle>
          <DialogDescription>
            Registra el gasto y resultados de una campaña de marketing corporativa. Estos datos financieros quedarán en el historial con tu nombre y fecha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Canal *</Label>
              <Select 
                value={formData.channel}
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="organico">Orgánico</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Inversión (€) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leads_generated">Leads Generados</Label>
              <Input
                id="leads_generated"
                type="number"
                min="0"
                value={formData.leads_generated}
                onChange={(e) => setFormData({ ...formData, leads_generated: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversions">Conversiones</Label>
              <Input
                id="conversions"
                type="number"
                min="0"
                value={formData.conversions}
                onChange={(e) => setFormData({ ...formData, conversions: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenue_generated">Ingresos Generados (€)</Label>
            <Input
              id="revenue_generated"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.revenue_generated}
              onChange={(e) => setFormData({ ...formData, revenue_generated: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Ingresos atribuibles directamente a esta campaña
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre esta campaña (objetivo, audiencia, creativos, etc.)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar Campaña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarketingFormModal;