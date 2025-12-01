import { z } from 'zod';

/**
 * Esquema de validación para feedback de tareas
 */
export const taskFeedbackSchema = z.object({
  whatWentWell: z.string()
    .trim()
    .min(10, 'Debe tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  metDeadlines: z.enum(['always', 'almost_always', 'sometimes', 'rarely', 'never'], {
    errorMap: () => ({ message: 'Selecciona una opción' })
  }),
  whatToImprove: z.string()
    .trim()
    .min(10, 'Debe tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  wouldRecommend: z.enum(['definitely_yes', 'probably_yes', 'not_sure', 'probably_no', 'definitely_no'], {
    errorMap: () => ({ message: 'Selecciona una opción' })
  }),
  rating: z.number()
    .min(1, 'Selecciona una valoración')
    .max(5, 'Valoración máxima es 5')
});

export type TaskFeedbackData = z.infer<typeof taskFeedbackSchema>;

/**
 * Esquema de validación para medición de impacto de tareas
 */
export const impactMeasurementSchema = z.object({
  ai_questions: z.record(z.any()).refine(
    (data) => Object.keys(data).length >= 2,
    { message: 'Responde al menos 2 preguntas' }
  ),
  key_metrics: z.array(z.object({
    metric: z.string().trim().min(1, 'Nombre de métrica requerido'),
    value: z.string().trim().min(1, 'Valor requerido'),
    unit: z.string().trim()
  })).optional(),
  impact_rating: z.enum(['exceeded', 'met', 'close', 'below']).optional(),
  impact_explanation: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
  future_decisions: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
  investments_needed: z.object({
    budget: z.number().optional(),
    tools: z.boolean().optional(),
    time: z.boolean().optional(),
    training: z.boolean().optional(),
    staff: z.boolean().optional(),
    none: z.boolean().optional(),
    details: z.string().optional()
  }).optional()
}).refine(
  (data) => {
    const filledMetrics = data.key_metrics?.filter(m => m.metric && m.value).length || 0;
    const hasImpactRating = !!data.impact_rating;
    const hasFutureDecisions = (data.future_decisions?.length || 0) > 0;
    const hasInvestments = Object.keys(data.investments_needed || {}).length > 0;
    
    const count = filledMetrics + (hasImpactRating ? 1 : 0) + (hasFutureDecisions ? 1 : 0) + (hasInvestments ? 1 : 0);
    return count >= 2;
  },
  { message: 'Completa al menos 2 campos de Medición de Impacto' }
);

export type ImpactMeasurementData = z.infer<typeof impactMeasurementSchema>;

/**
 * Esquema para actualización de progreso de OKR
 */
export const okrProgressSchema = z.object({
  new_value: z.number({ required_error: 'Valor requerido' })
    .finite('Debe ser un número válido'),
  comment: z.string()
    .trim()
    .min(10, 'El comentario debe tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres')
});

export type OKRProgressData = z.infer<typeof okrProgressSchema>;

/**
 * Esquema para crear/editar objetivos (OKR)
 */
export const objectiveSchema = z.object({
  title: z.string()
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'Máximo 1000 caracteres')
    .optional(),
  quarter: z.string().min(1, 'Trimestre requerido'),
  year: z.number()
    .int('Debe ser un año válido')
    .min(2024, 'Año inválido')
    .max(2100, 'Año inválido'),
  target_date: z.string().min(1, 'Fecha objetivo requerida'),
  budget_allocated: z.number().nonnegative('El presupuesto no puede ser negativo').optional(),
  revenue_impact: z.number().optional(),
  cost_savings: z.number().nonnegative('No puede ser negativo').optional()
});

export type ObjectiveData = z.infer<typeof objectiveSchema>;

/**
 * Esquema para Key Results
 */
export const keyResultSchema = z.object({
  title: z.string()
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string()
    .trim()
    .max(500, 'Máximo 500 caracteres')
    .optional(),
  metric_type: z.string().min(1, 'Tipo de métrica requerido'),
  start_value: z.number({ required_error: 'Valor inicial requerido' })
    .finite('Debe ser un número válido'),
  target_value: z.number({ required_error: 'Valor objetivo requerido' })
    .finite('Debe ser un número válido'),
  unit: z.string()
    .trim()
    .max(20, 'Máximo 20 caracteres')
    .optional(),
  weight: z.number()
    .min(0, 'El peso no puede ser negativo')
    .max(100, 'El peso no puede ser mayor a 100')
    .optional()
}).refine(
  (data) => data.target_value !== data.start_value,
  { message: 'El valor objetivo debe ser diferente al inicial', path: ['target_value'] }
);

export type KeyResultData = z.infer<typeof keyResultSchema>;
