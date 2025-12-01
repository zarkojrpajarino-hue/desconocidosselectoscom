import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { expenseEntrySchema } from '@/lib/metricsValidation';

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ExpenseFormModal = ({ open, onOpenChange, onSuccess }: ExpenseFormModalProps) => {
  const { user, currentOrganizationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'produccion',
    subcategory: '',
    description: '',
    vendor: '',
    payment_method: 'transferencia',
    is_recurring: false,
    recurring_frequency: 'mensual',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar con Zod
    const validation = expenseEntrySchema.safeParse({
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      description: formData.description,
      vendor: formData.vendor || undefined,
      payment_method: formData.payment_method as any,
      is_recurring: formData.is_recurring,
      recurring_frequency: formData.is_recurring ? formData.recurring_frequency as any : undefined,
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
      const { error } = await supabase.from('expense_entries').insert({
        date: validation.data.date,
        amount: validation.data.amount,
        category: validation.data.category,
        subcategory: validation.data.subcategory,
        description: validation.data.description,
        vendor: validation.data.vendor,
        payment_method: validation.data.payment_method,
        is_recurring: validation.data.is_recurring,
        recurring_frequency: validation.data.recurring_frequency,
        notes: validation.data.notes,
        created_by: user?.id,
        organization_id: currentOrganizationId
      });

      if (error) throw error;

      toast.success('Gasto registrado exitosamente');
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'produccion',
        subcategory: '',
        description: '',
        vendor: '',
        payment_method: 'transferencia',
        is_recurring: false,
        recurring_frequency: 'mensual',
        notes: ''
      });
    } catch (error: any) {
      console.error('Error creating expense entry:', error);
      toast.error('Error al registrar gasto', {
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
          <DialogTitle>Registrar Gasto de la Empresa</DialogTitle>
          <DialogDescription>
            Registra una nueva transacción de gasto corporativo. Estos son datos financieros de la empresa que quedarán en el historial con tu nombre y fecha.
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
              <Label htmlFor="amount">Monto (€) *</Label>
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
              <Label htmlFor="category">Categoría *</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produccion">Producción</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operaciones">Operaciones</SelectItem>
                  <SelectItem value="salarios">Salarios</SelectItem>
                  <SelectItem value="herramientas">Herramientas</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Input
                id="subcategory"
                placeholder="Ej: ingredientes, ads_facebook"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              required
              placeholder="Descripción del gasto"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Proveedor</Label>
              <Input
                id="vendor"
                placeholder="Nombre del proveedor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
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
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_recurring: checked as boolean })
                }
              />
              <Label htmlFor="is_recurring" className="cursor-pointer">
                ¿Es un gasto recurrente?
              </Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="recurring_frequency">Frecuencia</Label>
                <Select 
                  value={formData.recurring_frequency}
                  onValueChange={(value) => setFormData({ ...formData, recurring_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre este gasto..."
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
              {loading ? 'Guardando...' : 'Registrar Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormModal;