import { z } from 'zod';

/**
 * Zod validation schemas for forms
 * Provides type-safe validation across the app
 */

// ============ CRM / LEADS ============
export const leadSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .trim(),
  
  company: z.string()
    .max(100, 'El nombre de la empresa no puede superar 100 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede superar 255 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  phone: z.string()
    .max(20, 'El teléfono no puede superar 20 caracteres')
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, 'Formato de teléfono inválido')
    .optional()
    .nullable(),
  
  estimated_value: z.number()
    .positive('El valor debe ser positivo')
    .max(100_000_000, 'El valor es demasiado alto')
    .optional()
    .default(0),
  
  probability: z.number()
    .min(0, 'La probabilidad debe ser entre 0 y 100')
    .max(100, 'La probabilidad debe ser entre 0 y 100')
    .optional()
    .default(50),
  
  notes: z.string()
    .max(2000, 'Las notas no pueden superar 2000 caracteres')
    .optional()
    .nullable(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// ============ BUSINESS METRICS ============
export const businessMetricsSchema = z.object({
  metric_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  
  revenue: z.number()
    .nonnegative('Los ingresos no pueden ser negativos')
    .max(100_000_000, 'Valor demasiado alto')
    .optional()
    .nullable(),
  
  orders_count: z.number()
    .int('Debe ser un número entero')
    .nonnegative('No puede ser negativo')
    .max(1_000_000, 'Valor demasiado alto')
    .optional()
    .nullable(),
  
  leads_generated: z.number()
    .int('Debe ser un número entero')
    .nonnegative('No puede ser negativo')
    .max(100_000, 'Valor demasiado alto')
    .optional()
    .nullable(),
  
  cac: z.number()
    .nonnegative('El CAC no puede ser negativo')
    .max(100_000, 'Valor demasiado alto')
    .optional()
    .nullable(),
  
  conversion_rate: z.number()
    .min(0, 'Debe estar entre 0 y 100')
    .max(100, 'Debe estar entre 0 y 100')
    .optional()
    .nullable(),
  
  notes: z.string()
    .max(1000, 'Las notas no pueden superar 1000 caracteres')
    .optional()
    .nullable(),
});

export type BusinessMetricsFormData = z.infer<typeof businessMetricsSchema>;

// ============ OKRs ============
export const objectiveSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede superar 200 caracteres')
    .trim(),
  
  description: z.string()
    .max(1000, 'La descripción no puede superar 1000 caracteres')
    .optional()
    .nullable(),
  
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  
  year: z.number()
    .int('Debe ser un número entero')
    .min(2020, 'Año inválido')
    .max(2100, 'Año inválido'),
  
  revenue_impact: z.number()
    .nonnegative('No puede ser negativo')
    .max(100_000_000, 'Valor demasiado alto')
    .optional()
    .nullable(),
  
  budget_allocated: z.number()
    .nonnegative('No puede ser negativo')
    .max(100_000_000, 'Valor demasiado alto')
    .optional()
    .nullable(),
});

export type ObjectiveFormData = z.infer<typeof objectiveSchema>;

export const keyResultSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede superar 200 caracteres')
    .trim(),
  
  description: z.string()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional()
    .nullable(),
  
  metric_type: z.string()
    .min(1, 'El tipo de métrica es requerido'),
  
  start_value: z.number(),
  
  target_value: z.number(),
  
  current_value: z.number(),
  
  unit: z.string()
    .max(20, 'La unidad no puede superar 20 caracteres')
    .optional()
    .nullable(),
  
  weight: z.number()
    .min(0, 'Debe estar entre 0 y 100')
    .max(100, 'Debe estar entre 0 y 100')
    .default(25),
}).refine(
  (data) => data.target_value !== data.start_value,
  'El valor objetivo debe ser diferente al valor inicial'
);

export type KeyResultFormData = z.infer<typeof keyResultSchema>;

// ============ FINANCIAL ============
export const revenueEntrySchema = z.object({
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  
  amount: z.number()
    .positive('El monto debe ser positivo')
    .max(100_000_000, 'Valor demasiado alto'),
  
  product_category: z.string()
    .min(1, 'La categoría es requerida')
    .max(100, 'La categoría no puede superar 100 caracteres'),
  
  product_name: z.string()
    .max(200, 'El nombre no puede superar 200 caracteres')
    .optional()
    .nullable(),
  
  customer_name: z.string()
    .max(200, 'El nombre no puede superar 200 caracteres')
    .optional()
    .nullable(),
  
  notes: z.string()
    .max(1000, 'Las notas no pueden superar 1000 caracteres')
    .optional()
    .nullable(),
});

export type RevenueEntryFormData = z.infer<typeof revenueEntrySchema>;

export const expenseEntrySchema = z.object({
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  
  amount: z.number()
    .positive('El monto debe ser positivo')
    .max(100_000_000, 'Valor demasiado alto'),
  
  category: z.string()
    .min(1, 'La categoría es requerida')
    .max(100, 'La categoría no puede superar 100 caracteres'),
  
  description: z.string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  
  vendor: z.string()
    .max(200, 'El proveedor no puede superar 200 caracteres')
    .optional()
    .nullable(),
  
  notes: z.string()
    .max(1000, 'Las notas no pueden superar 1000 caracteres')
    .optional()
    .nullable(),
});

export type ExpenseEntryFormData = z.infer<typeof expenseEntrySchema>;

// ============ AUTH ============
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede superar 255 caracteres')
    .trim(),
  
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede superar 100 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede superar 255 caracteres')
    .trim(),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede superar 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  
  confirmPassword: z.string(),
  
  full_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .trim(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }
);

export type SignupFormData = z.infer<typeof signupSchema>;
