/**
 * Shared validation utilities for Edge Functions
 * Uses Zod for schema validation
 */

// Import Zod from esm.sh for Deno compatibility
import { z, ZodError, ZodSchema } from 'https://esm.sh/zod@3.22.4';

export { z };

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly errors: ZodError;
  
  constructor(message: string, errors: ZodError) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validates input data against a Zod schema
 * @throws ValidationError if validation fails
 */
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', error);
    }
    throw error;
  }
}

/**
 * Safely validates input and returns result with success flag
 */
export function safeValidate<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Creates a validation error Response
 */
export function validationErrorResponse(
  error: ValidationError | ZodError, 
  corsHeaders: Record<string, string>
): Response {
  const zodError = error instanceof ValidationError ? error.errors : error;
  
  return new Response(
    JSON.stringify({
      error: 'Validation Error',
      message: 'Los datos enviados no son válidos',
      details: zodError.format(),
      issues: zodError.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

// ============================================
// Common Reusable Schemas
// ============================================

export const CommonSchemas = {
  // Basic types
  uuid: z.string().uuid({ message: 'UUID inválido' }),
  email: z.string().email({ message: 'Email inválido' }),
  url: z.string().url({ message: 'URL inválida' }),
  
  // Numbers
  positiveNumber: z.number().positive({ message: 'Debe ser un número positivo' }),
  nonNegativeNumber: z.number().nonnegative({ message: 'No puede ser negativo' }),
  percentage: z.number().min(0).max(100, { message: 'Debe estar entre 0 y 100' }),
  
  // Strings
  nonEmptyString: z.string().min(1, { message: 'No puede estar vacío' }).max(1000),
  shortString: z.string().min(1).max(100),
  longString: z.string().max(5000),
  
  // IDs
  organizationId: z.string().uuid({ message: 'ID de organización inválido' }),
  userId: z.string().uuid({ message: 'ID de usuario inválido' }),
  
  // Dates
  isoDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha inválida',
  }),
  
  // Arrays
  uuidArray: z.array(z.string().uuid()).max(100),
  stringArray: z.array(z.string()).max(100),
};

// ============================================
// Domain-Specific Schemas
// ============================================

/**
 * Schema for lead data
 */
export const LeadSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  company: z.string().max(100).optional().nullable(),
  email: z.string().email('Email inválido').max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  estimated_value: z.number().nonnegative().max(100_000_000).optional().default(0),
  probability: z.number().min(0).max(100).optional().default(50),
  notes: z.string().max(2000).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  stage: z.string().max(50).optional(),
  organization_id: CommonSchemas.organizationId,
});

/**
 * Schema for task data
 */
export const TaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(2000).optional().nullable(),
  estimated_hours: z.number().positive().max(100).optional(),
  phase: z.number().int().min(1).max(4).optional(),
  area: z.string().max(50).optional(),
  organization_id: CommonSchemas.organizationId,
});

/**
 * Schema for OKR objective data
 */
export const ObjectiveSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(200),
  description: z.string().max(1000).optional().nullable(),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  year: z.number().int().min(2020).max(2100),
  status: z.enum(['draft', 'active', 'achieved', 'cancelled']).optional(),
  organization_id: CommonSchemas.organizationId,
});

/**
 * Schema for key result data
 */
export const KeyResultSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(500).optional().nullable(),
  start_value: z.number(),
  target_value: z.number(),
  current_value: z.number(),
  unit: z.string().max(20).optional().nullable(),
  weight: z.number().min(0).max(100).default(25),
  objective_id: CommonSchemas.uuid,
}).refine(
  (data) => data.target_value !== data.start_value,
  { message: 'El valor objetivo debe ser diferente al valor inicial' }
);

/**
 * Schema for workspace generation
 */
export const GenerateWorkspaceSchema = z.object({
  userId: CommonSchemas.userId,
  companyName: z.string().min(1).max(100),
  industry: z.string().min(1).max(50),
  targetMarket: z.string().min(1).max(200),
  productDescription: z.string().min(10).max(1000),
  monthlyRevenue: z.number().nonnegative().optional(),
  teamSize: z.number().int().positive().max(1000).optional(),
});

/**
 * Schema for HubSpot sync
 */
export const HubSpotSyncSchema = z.object({
  organization_id: CommonSchemas.organizationId,
  leads: z.array(z.object({
    id: CommonSchemas.uuid,
    email: CommonSchemas.email,
    name: z.string().min(1),
    company: z.string().optional(),
    phone: z.string().optional(),
  })).min(1).max(100).optional(),
  action: z.enum(['sync', 'import', 'export']).optional(),
});

/**
 * Schema for Asana/Trello sync
 */
export const ProjectToolSyncSchema = z.object({
  organizationId: CommonSchemas.organizationId,
  taskId: CommonSchemas.uuid.optional(),
  listId: z.string().optional(),
  projectId: z.string().optional(),
});

/**
 * Schema for webhook trigger
 */
export const WebhookTriggerSchema = z.object({
  organization_id: CommonSchemas.organizationId,
  event_type: z.string().min(1).max(100),
  payload: z.record(z.unknown()).optional(),
});

/**
 * Schema for email sending
 */
export const SendEmailSchema = z.object({
  to: z.union([CommonSchemas.email, z.array(CommonSchemas.email)]),
  subject: z.string().min(1).max(200),
  templateId: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
});

/**
 * Schema for AI analysis request
 */
export const AIAnalysisSchema = z.object({
  organizationId: CommonSchemas.organizationId,
  userId: CommonSchemas.userId,
  analysisType: z.enum(['financial', 'team', 'competitive', 'scalability']).optional(),
  options: z.object({
    includeRecommendations: z.boolean().optional(),
    depth: z.enum(['basic', 'detailed', 'comprehensive']).optional(),
  }).optional(),
});

// ============================================
// New Schemas for Edge Function Input Validation
// ============================================

/**
 * Schema for welcome email request
 */
export const WelcomeEmailSchema = z.object({
  userId: CommonSchemas.userId,
});

/**
 * Schema for Slack notification event data
 */
export const SlackEventDataSchema = z.object({
  id: CommonSchemas.uuid.optional(),
  name: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(200).optional(),
  value: z.number().optional(),
  title: z.string().max(300).optional(),
  progress: z.number().min(0).max(100).optional(),
  full_name: z.string().max(200).optional(),
  threshold: z.number().optional(),
}).passthrough(); // Allow additional fields for flexibility

/**
 * Schema for Slack notify request
 */
export const SlackNotifySchema = z.object({
  organization_id: CommonSchemas.organizationId,
  event_type: z.string()
    .min(1, 'Event type is required')
    .max(50, 'Event type too long')
    .regex(/^[a-z]+\.[a-z_]+$/, 'Event type must follow format: category.action (e.g., lead.created)'),
  data: SlackEventDataSchema,
});

/**
 * Schema for API v1 lead creation/update
 */
export const ApiLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  estimated_value: z.number().nonnegative().max(100_000_000).optional(),
  probability: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  stage: z.string().max(50).optional(),
  assigned_to: CommonSchemas.uuid.optional().nullable(),
});

/**
 * Schema for API v1 task creation/update
 */
export const ApiTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  estimated_hours: z.number().positive().max(200).optional(),
  phase: z.number().int().min(1).max(10).optional(),
  area: z.string().max(50).optional(),
  assigned_to: CommonSchemas.uuid.optional().nullable(),
  due_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional().nullable(),
});