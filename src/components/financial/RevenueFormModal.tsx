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
import { revenueEntrySchema } from '@/lib/metricsValidation';

interface RevenueFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RevenueFormModal = ({ open, onOpenChange, onSuccess }: RevenueFormModalProps) => {
  const { user, currentOrganizationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    product_category: 'premium',
    product_name: '',
    quantity: '1',
    unit_price: '',
    customer_name: '',
    customer_type: 'individual',
    payment_method: 'stripe',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar con Zod
    const validation = revenueEntrySchema.safeParse({
      date: formData.date,
      amount: parseFloat(formData.amount),
      product_category: formData.product_category,
      product_name: formData.product_name || undefined,
      customer_name: formData.customer_name || undefined,
      customer_type: formData.customer_type as any,
      quantity: parseInt(formData.quantity),
      unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
      payment_method: formData.payment_method as any,
      notes: formData.notes || undefined
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message, {
        description: `Campo: ${firstError.path.join('.')}`
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('revenue_entries').insert({
        date: validation.data.date,
        amount: validation.data.amount,
        product_category: validation.data.product_category,
        product_name: validation.data.product_name,
        customer_name: validation.data.customer_name,
        customer_type: validation.data.customer_type,
        quantity: validation.data.quantity,
        unit_price: validation.data.unit_price,
        payment_method: validation.data.payment_method,
        notes: validation.data.notes,
        created_by: user?.id,
        organization_id: currentOrganizationId
      });

      if (error) throw error;

      toast.success('Ingreso registrado exitosamente');
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        product_category: 'premium',
        product_name: '',
        quantity: '1',
        unit_price: '',
        customer_name: '',
        customer_type: 'individual',
        payment_method: 'stripe',
        notes: ''
      });
    } catch (error: any) {
      console.error('Error creating revenue entry:', error);
      toast.error('Error al registrar ingreso', {
        description: error.message || 'Intenta de nuevo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Ingreso de la Empresa</DialogTitle>
          <DialogDescription>
            Registra una nueva transacción de ingreso corporativo. Estos son datos financieros de la empresa que quedarán en el historial con tu nombre y fecha.
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
              <Label htmlFor="amount">Monto Total (€) *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_category">Categoría de Producto *</Label>
              <Select 
                value={formData.product_category}
                onValueChange={(value) => setFormData({ ...formData, product_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="personalizadas">Personalizadas</SelectItem>
                  <SelectItem value="estandar">Estándar</SelectItem>
                  <SelectItem value="basicas">Básicas</SelectItem>
                  <SelectItem value="corporativas">Corporativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">Nombre del Producto</Label>
              <Input
                id="product_name"
                placeholder="Ej: Cesta Premium Deluxe"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">Precio Unitario (€)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nombre del Cliente</Label>
              <Input
                id="customer_name"
                placeholder="Ej: María García"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_type">Tipo de Cliente</Label>
              <Select 
                value={formData.customer_type}
                onValueChange={(value) => setFormData({ ...formData, customer_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                  <SelectItem value="recurring">Recurrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago</Label>
            <Select 
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre esta transacción..."
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
              {loading ? 'Guardando...' : 'Registrar Ingreso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RevenueFormModal;