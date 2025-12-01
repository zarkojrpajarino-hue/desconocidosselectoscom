import { z } from 'zod';

/**
 * Esquema para métricas de negocio
 */
export const businessMetricsSchema = z.object({
  metric_date: z.string().min(1, 'Fecha requerida'),
  revenue: z.number().nonnegative('No puede ser negativo').optional(),
  orders_count: z.number().int('Debe ser un número entero').nonnegative('No puede ser negativo').optional(),
  avg_ticket: z.number().nonnegative('No puede ser negativo').optional(),
  leads_generated: z.number().int('Debe ser un número entero').nonnegative('No puede ser negativo').optional(),
  conversion_rate: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').optional(),
  cac: z.number().nonnegative('No puede ser negativo').optional(),
  lifetime_value: z.number().nonnegative('No puede ser negativo').optional(),
  repeat_rate: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').optional(),
  nps_score: z.number().int('Debe ser un número entero').min(-100, 'Mínimo -100').max(100, 'Máximo 100').optional(),
  satisfaction_score: z.number().min(0, 'Mínimo 0').max(10, 'Máximo 10').optional(),
  reviews_count: z.number().int('Debe ser un número entero').nonnegative('No puede ser negativo').optional(),
  reviews_avg: z.number().min(0, 'Mínimo 0').max(5, 'Máximo 5').optional(),
  engagement_rate: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').optional(),
  production_time: z.number().nonnegative('No puede ser negativo').optional(),
  capacity_used: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').optional(),
  operational_costs: z.number().nonnegative('No puede ser negativo').optional(),
  error_rate: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').optional(),
  notes: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional()
}).refine(
  (data) => {
    // Al menos una métrica debe estar completada
    const metrics = [
      data.revenue, data.orders_count, data.avg_ticket, data.leads_generated,
      data.conversion_rate, data.cac, data.lifetime_value, data.repeat_rate,
      data.nps_score, data.satisfaction_score, data.reviews_count, data.reviews_avg,
      data.engagement_rate, data.production_time, data.capacity_used,
      data.operational_costs, data.error_rate
    ];
    return metrics.some(m => m !== undefined && m !== null);
  },
  { message: 'Completa al menos una métrica' }
);

export type BusinessMetricsData = z.infer<typeof businessMetricsSchema>;

/**
 * Esquema para transacciones de ingresos
 */
export const revenueEntrySchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  amount: z.number({ required_error: 'Monto requerido' })
    .positive('El monto debe ser mayor a 0'),
  product_category: z.string().trim().min(1, 'Categoría requerida').max(100, 'Máximo 100 caracteres'),
  product_name: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  customer_name: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  customer_type: z.enum(['new', 'recurring', 'reactivated']).optional(),
  quantity: z.number().int('Debe ser un número entero').positive('Debe ser mayor a 0').optional(),
  unit_price: z.number().positive('Debe ser mayor a 0').optional(),
  payment_method: z.enum(['card', 'transfer', 'cash', 'other']).optional(),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres').optional()
});

export type RevenueEntryData = z.infer<typeof revenueEntrySchema>;

/**
 * Esquema para transacciones de gastos
 */
export const expenseEntrySchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  amount: z.number({ required_error: 'Monto requerido' })
    .positive('El monto debe ser mayor a 0'),
  category: z.string().trim().min(1, 'Categoría requerida').max(100, 'Máximo 100 caracteres'),
  subcategory: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  description: z.string().trim().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  vendor: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  payment_method: z.enum(['card', 'transfer', 'cash', 'other']).optional(),
  is_recurring: z.boolean().optional(),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres').optional()
});

export type ExpenseEntryData = z.infer<typeof expenseEntrySchema>;

/**
 * Esquema para inversión en marketing
 */
export const marketingSpendSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  amount: z.number({ required_error: 'Monto requerido' })
    .positive('El monto debe ser mayor a 0'),
  channel: z.string().trim().min(1, 'Canal requerido').max(100, 'Máximo 100 caracteres'),
  leads_generated: z.number().int('Debe ser un número entero').nonnegative('No puede ser negativo').optional(),
  conversions: z.number().int('Debe ser un número entero').nonnegative('No puede ser negativo').optional(),
  revenue_generated: z.number().nonnegative('No puede ser negativo').optional(),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres').optional()
});

export type MarketingSpendData = z.infer<typeof marketingSpendSchema>;
