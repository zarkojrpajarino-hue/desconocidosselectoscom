export type AppRole = 
  | 'admin'
  | 'marketing'
  | 'ventas'
  | 'finanzas'
  | 'operaciones'
  | 'producto'
  | 'rrhh'
  | 'legal'
  | 'soporte'
  | 'custom'

export interface UserRole {
  id: string
  user_id: string
  organization_id: string
  role: AppRole
  role_name?: string
  role_description?: string
  created_at: string
  updated_at: string
}

export interface OrganizationInvitation {
  id: string
  organization_id: string
  token: string
  created_by: string
  created_at: string
  is_active: boolean
}

export interface RoleOption {
  value: AppRole
  label: string
  description: string
  icon: string
}

export const PREDEFINED_ROLES: RoleOption[] = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Gestión general, estrategia y toma de decisiones',
    icon: '👑'
  },
  {
    value: 'marketing',
    label: 'Marketing y Redes',
    description: 'Campañas, redes sociales y adquisición de clientes',
    icon: '📱'
  },
  {
    value: 'ventas',
    label: 'Ventas y Leads',
    description: 'Gestión de leads, pipeline y cierre de deals',
    icon: '💰'
  },
  {
    value: 'finanzas',
    label: 'Finanzas',
    description: 'Control financiero, presupuestos y contabilidad',
    icon: '📊'
  },
  {
    value: 'operaciones',
    label: 'Operaciones',
    description: 'Procesos, logística y eficiencia operativa',
    icon: '⚙️'
  },
  {
    value: 'producto',
    label: 'Producto',
    description: 'Desarrollo, roadmap, features y UX/UI',
    icon: '🎨'
  },
  {
    value: 'rrhh',
    label: 'Recursos Humanos',
    description: 'Reclutamiento, cultura y desarrollo de talento',
    icon: '👥'
  },
  {
    value: 'legal',
    label: 'Legal',
    description: 'Contratos, compliance y asesoría legal',
    icon: '⚖️'
  },
  {
    value: 'soporte',
    label: 'Soporte al Cliente',
    description: 'Atención al cliente y resolución de incidencias',
    icon: '🎧'
  },
  {
    value: 'custom',
    label: 'Rol Personalizado',
    description: 'Define un rol específico para tu empresa',
    icon: '✨'
  }
]