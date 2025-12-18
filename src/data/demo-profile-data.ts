// Demo data for Profile sections

export const DEMO_PROFILE_STATS = {
  totalCompleted: 47,
  totalValidated: 42,
  totalCollaborative: 15,
  averageRating: '4.7',
};

export const DEMO_WEEKLY_PROGRESS = [
  { week: 'Sem 1', tareas: 5, fecha: '04 nov' },
  { week: 'Sem 2', tareas: 7, fecha: '11 nov' },
  { week: 'Sem 3', tareas: 4, fecha: '18 nov' },
  { week: 'Sem 4', tareas: 8, fecha: '25 nov' },
  { week: 'Sem 5', tareas: 6, fecha: '02 dic' },
  { week: 'Sem 6', tareas: 9, fecha: '09 dic' },
  { week: 'Sem 7', tareas: 5, fecha: '16 dic' },
  { week: 'Sem 8', tareas: 3, fecha: '23 dic' },
];

export const DEMO_TASKS_BY_AREA = [
  { name: 'Marketing', value: 12 },
  { name: 'Ventas', value: 15 },
  { name: 'Operaciones', value: 8 },
  { name: 'Finanzas', value: 7 },
  { name: 'Producto', value: 5 },
];

export const DEMO_RECENT_TASKS = [
  { id: '1', completed_at: new Date().toISOString(), tasks: { title: 'Revisar propuesta comercial Q1', area: 'Ventas' } },
  { id: '2', completed_at: new Date(Date.now() - 86400000).toISOString(), tasks: { title: 'Análisis de competencia mensual', area: 'Marketing' } },
  { id: '3', completed_at: new Date(Date.now() - 172800000).toISOString(), tasks: { title: 'Optimizar landing page principal', area: 'Marketing' } },
  { id: '4', completed_at: new Date(Date.now() - 259200000).toISOString(), tasks: { title: 'Cerrar negociación cliente enterprise', area: 'Ventas' } },
  { id: '5', completed_at: new Date(Date.now() - 345600000).toISOString(), tasks: { title: 'Revisar flujo de caja mensual', area: 'Finanzas' } },
  { id: '6', completed_at: new Date(Date.now() - 432000000).toISOString(), tasks: { title: 'Configurar automatización email', area: 'Marketing' } },
  { id: '7', completed_at: new Date(Date.now() - 518400000).toISOString(), tasks: { title: 'Documentar proceso de ventas', area: 'Operaciones' } },
  { id: '8', completed_at: new Date(Date.now() - 604800000).toISOString(), tasks: { title: 'Validar KPIs del mes', area: 'Finanzas' } },
];

export const DEMO_ACHIEVEMENTS = {
  total_points: 2450,
  current_streak: 5,
  tasks_completed_total: 47,
  tasks_validated_total: 42,
  perfect_weeks: 3,
};

export const DEMO_BADGES = [
  { 
    id: '1', 
    earned_at: new Date(Date.now() - 86400000).toISOString(), 
    badges: { 
      id: 'b1', 
      code: 'first_task', 
      name: 'Primera Tarea', 
      description: 'Completaste tu primera tarea', 
      icon_emoji: '🎯', 
      rarity: 'common' 
    } 
  },
  { 
    id: '2', 
    earned_at: new Date(Date.now() - 172800000).toISOString(), 
    badges: { 
      id: 'b2', 
      code: 'week_warrior', 
      name: 'Guerrero Semanal', 
      description: 'Completaste todas las tareas de una semana', 
      icon_emoji: '⚔️', 
      rarity: 'rare' 
    } 
  },
  { 
    id: '3', 
    earned_at: new Date(Date.now() - 604800000).toISOString(), 
    badges: { 
      id: 'b3', 
      code: 'team_player', 
      name: 'Jugador de Equipo', 
      description: 'Completaste 10 tareas colaborativas', 
      icon_emoji: '🤝', 
      rarity: 'epic' 
    } 
  },
  { 
    id: '4', 
    earned_at: new Date(Date.now() - 864000000).toISOString(), 
    badges: { 
      id: 'b4', 
      code: 'streak_master', 
      name: 'Maestro de Racha', 
      description: 'Mantuviste una racha de 4 semanas', 
      icon_emoji: '🔥', 
      rarity: 'legendary' 
    } 
  },
];

export const DEMO_ORGANIZATIONS = [
  {
    organization_id: 'demo-org-1',
    organization_name: 'OPTIMUS-K Principal',
    role: 'admin',
    unreadNotifications: 3,
  },
  {
    organization_id: 'demo-org-2',
    organization_name: 'Startup Innovadora SL',
    role: 'leader',
    unreadNotifications: 7,
  },
  {
    organization_id: 'demo-org-3',
    organization_name: 'Consultoría Digital',
    role: 'member',
    unreadNotifications: 0,
  },
];

export const DEMO_TEAM_USERS = [
  {
    user_id: 'demo-user-1',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    user: { id: 'demo-user-1', email: 'admin@optimus-k.com', full_name: 'Carlos Administrador' },
    tasks_completed: 52,
  },
  {
    user_id: 'demo-user-2',
    role: 'leader',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    user: { id: 'demo-user-2', email: 'maria@optimus-k.com', full_name: 'María García' },
    tasks_completed: 38,
  },
  {
    user_id: 'demo-user-3',
    role: 'member',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    user: { id: 'demo-user-3', email: 'juan@optimus-k.com', full_name: 'Juan Pérez' },
    tasks_completed: 25,
  },
  {
    user_id: 'demo-user-4',
    role: 'member',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    user: { id: 'demo-user-4', email: 'ana@optimus-k.com', full_name: 'Ana Rodríguez' },
    tasks_completed: 18,
  },
];

export const DEMO_PRODUCTS = [
  {
    name: 'Plan Starter SaaS',
    price: '129',
    cost: '25',
    category: 'Suscripción',
    description: 'Plan básico para pequeñas empresas',
    unitsSoldPerMonth: '45',
    productionTime: 'Inmediato',
  },
  {
    name: 'Plan Professional SaaS',
    price: '249',
    cost: '40',
    category: 'Suscripción',
    description: 'Plan avanzado con todas las funcionalidades',
    unitsSoldPerMonth: '28',
    productionTime: 'Inmediato',
  },
  {
    name: 'Consultoría Estratégica',
    price: '2500',
    cost: '800',
    category: 'Consultoría',
    description: 'Sesiones de consultoría personalizada',
    unitsSoldPerMonth: '6',
    productionTime: '2-3 días',
  },
  {
    name: 'Implementación Enterprise',
    price: '4999',
    cost: '1500',
    category: 'Servicio',
    description: 'Implementación completa para grandes empresas',
    unitsSoldPerMonth: '2',
    productionTime: '2-4 semanas',
  },
];
