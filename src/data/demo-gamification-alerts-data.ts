// Demo data for Gamification and Alerts sections

export const DEMO_BADGES = [
  {
    id: 'badge-1',
    badges: {
      id: 'b1',
      name: 'Primer Paso',
      description: 'Completaste tu primera tarea',
      icon_emoji: '🎯',
      rarity: 'common'
    }
  },
  {
    id: 'badge-2',
    badges: {
      id: 'b2',
      name: 'Racha de 3',
      description: 'Mantuviste una racha de 3 semanas',
      icon_emoji: '🔥',
      rarity: 'common'
    }
  },
  {
    id: 'badge-3',
    badges: {
      id: 'b3',
      name: 'Finanzas Pro',
      description: 'Registraste 10 métricas financieras',
      icon_emoji: '💰',
      rarity: 'rare'
    }
  },
  {
    id: 'badge-4',
    badges: {
      id: 'b4',
      name: 'Líder de Ventas',
      description: 'Cerraste 5 deals en un mes',
      icon_emoji: '🏆',
      rarity: 'rare'
    }
  },
  {
    id: 'badge-5',
    badges: {
      id: 'b5',
      name: 'Maestro OKR',
      description: 'Completaste todos los OKRs de un trimestre',
      icon_emoji: '🎖️',
      rarity: 'epic'
    }
  },
  {
    id: 'badge-6',
    badges: {
      id: 'b6',
      name: 'Leyenda',
      description: 'Alcanzaste 10,000 puntos totales',
      icon_emoji: '👑',
      rarity: 'legendary'
    }
  }
];

export const DEMO_ACHIEVEMENT = {
  id: 'ach-1',
  user_id: 'demo-user',
  total_points: 2450,
  current_streak: 5,
  best_streak: 8,
  tasks_completed_total: 47
};

export const DEMO_LEADERBOARD = [
  {
    id: 'lead-1',
    user_id: 'user-1',
    total_points: 3200,
    current_streak: 7,
    tasks_completed_total: 65,
    users: { full_name: 'María García', username: 'mgarcia' }
  },
  {
    id: 'lead-2',
    user_id: 'demo-user',
    total_points: 2450,
    current_streak: 5,
    tasks_completed_total: 47,
    users: { full_name: 'Tú', username: 'you' }
  },
  {
    id: 'lead-3',
    user_id: 'user-2',
    total_points: 2100,
    current_streak: 4,
    tasks_completed_total: 42,
    users: { full_name: 'Carlos López', username: 'clopez' }
  },
  {
    id: 'lead-4',
    user_id: 'user-3',
    total_points: 1850,
    current_streak: 3,
    tasks_completed_total: 38,
    users: { full_name: 'Ana Martínez', username: 'amartinez' }
  },
  {
    id: 'lead-5',
    user_id: 'user-4',
    total_points: 1200,
    current_streak: 2,
    tasks_completed_total: 25,
    users: { full_name: 'Pedro Sánchez', username: 'psanchez' }
  }
];

export const DEMO_POINTS_HISTORY = [
  { id: 'p1', reason: 'Tarea completada: Análisis de mercado', points: 50, created_at: new Date().toISOString() },
  { id: 'p2', reason: 'Bonus: Racha de 5 semanas', points: 100, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'p3', reason: 'OKR completado: Aumentar ventas 20%', points: 200, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 'p4', reason: 'Badge desbloqueado: Líder de Ventas', points: 150, created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 'p5', reason: 'Tarea completada: Actualizar CRM', points: 30, created_at: new Date(Date.now() - 345600000).toISOString() }
];

// Level system
export const LEVELS = [
  { level: 1, name: 'Principiante', minPoints: 0, maxPoints: 499, icon: '🌱', color: 'text-green-500' },
  { level: 2, name: 'Aprendiz', minPoints: 500, maxPoints: 1499, icon: '📚', color: 'text-blue-500' },
  { level: 3, name: 'Competente', minPoints: 1500, maxPoints: 2999, icon: '⚡', color: 'text-yellow-500' },
  { level: 4, name: 'Experto', minPoints: 3000, maxPoints: 5999, icon: '🏅', color: 'text-orange-500' },
  { level: 5, name: 'Maestro', minPoints: 6000, maxPoints: 9999, icon: '🎖️', color: 'text-purple-500' },
  { level: 6, name: 'Leyenda', minPoints: 10000, maxPoints: Infinity, icon: '👑', color: 'text-yellow-400' }
];

export const getLevelFromPoints = (points: number) => {
  return LEVELS.find(l => points >= l.minPoints && points <= l.maxPoints) || LEVELS[0];
};

export const getProgressToNextLevel = (points: number) => {
  const currentLevel = getLevelFromPoints(points);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  if (!nextLevel) return 100;
  const progressInLevel = points - currentLevel.minPoints;
  const levelRange = currentLevel.maxPoints - currentLevel.minPoints + 1;
  return Math.min(100, Math.round((progressInLevel / levelRange) * 100));
};

// All available badges for unlocking
export const ALL_BADGES = [
  { code: 'first_task', name: 'Primer Paso', description: 'Completa tu primera tarea', icon_emoji: '🎯', rarity: 'common', requirement: '1 tarea' },
  { code: 'streak_3', name: 'Racha de 3', description: 'Mantén una racha de 3 semanas', icon_emoji: '🔥', rarity: 'common', requirement: '3 semanas seguidas' },
  { code: 'streak_7', name: 'Imparable', description: 'Mantén una racha de 7 semanas', icon_emoji: '💥', rarity: 'rare', requirement: '7 semanas seguidas' },
  { code: 'tasks_10', name: 'Productivo', description: 'Completa 10 tareas', icon_emoji: '✅', rarity: 'common', requirement: '10 tareas' },
  { code: 'tasks_50', name: 'Máquina', description: 'Completa 50 tareas', icon_emoji: '🤖', rarity: 'rare', requirement: '50 tareas' },
  { code: 'tasks_100', name: 'Titán', description: 'Completa 100 tareas', icon_emoji: '🦾', rarity: 'epic', requirement: '100 tareas' },
  { code: 'finance_pro', name: 'Finanzas Pro', description: 'Registra 10 métricas financieras', icon_emoji: '💰', rarity: 'rare', requirement: '10 métricas' },
  { code: 'sales_leader', name: 'Líder de Ventas', description: 'Cierra 5 deals en un mes', icon_emoji: '🏆', rarity: 'rare', requirement: '5 deals' },
  { code: 'okr_master', name: 'Maestro OKR', description: 'Completa todos los OKRs de un trimestre', icon_emoji: '🎖️', rarity: 'epic', requirement: '100% OKRs' },
  { code: 'team_player', name: 'Jugador de Equipo', description: 'Colabora en 20 tareas', icon_emoji: '🤝', rarity: 'rare', requirement: '20 colaboraciones' },
  { code: 'early_bird', name: 'Madrugador', description: 'Completa tareas antes de las 8am', icon_emoji: '🌅', rarity: 'common', requirement: '5 tareas temprano' },
  { code: 'legend', name: 'Leyenda', description: 'Alcanza 10,000 puntos totales', icon_emoji: '👑', rarity: 'legendary', requirement: '10,000 puntos' }
];

// Demo alerts
export const DEMO_ALERTS = [
  {
    id: 'alert-1',
    alert_type: 'kpi_alert',
    severity: 'urgent' as const,
    title: 'Caída en Conversión',
    message: 'La tasa de conversión ha bajado un 15% esta semana. Revisa tu pipeline de ventas.',
    context: { current: 12, previous: 27, change: -15 },
    source: 'CRM Analytics',
    actionable: true,
    action_label: 'Ver Pipeline',
    action_url: '/crm/hub',
    created_at: new Date().toISOString(),
    dismissed: false
  },
  {
    id: 'alert-2',
    alert_type: 'task_reminder',
    severity: 'important' as const,
    title: 'Tareas Pendientes',
    message: 'Tienes 5 tareas que vencen mañana. ¡No las olvides!',
    context: { pending_tasks: 5, due_date: 'mañana' },
    source: 'Task Manager',
    actionable: true,
    action_label: 'Ver Tareas',
    action_url: '/home',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    dismissed: false
  },
  {
    id: 'alert-3',
    alert_type: 'opportunity',
    severity: 'opportunity' as const,
    title: 'Nuevo Lead Caliente',
    message: 'Un lead con score 85+ ha mostrado interés. Contacta en las próximas 24h.',
    context: { lead_name: 'TechCorp S.L.', score: 87 },
    source: 'Lead Scoring',
    actionable: true,
    action_label: 'Ver Lead',
    action_url: '/crm/hub',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    dismissed: false
  },
  {
    id: 'alert-4',
    alert_type: 'celebration',
    severity: 'celebration' as const,
    title: '¡Meta Alcanzada!',
    message: 'Has superado tu objetivo de ventas mensual en un 12%. ¡Excelente trabajo!',
    context: { target: 50000, achieved: 56000, percentage: 112 },
    source: 'Goals Tracker',
    actionable: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    dismissed: false
  },
  {
    id: 'alert-5',
    alert_type: 'financial_alert',
    severity: 'important' as const,
    title: 'Cash Flow Bajo',
    message: 'El flujo de caja proyectado para el próximo mes está por debajo del mínimo recomendado.',
    context: { projected: 15000, minimum: 20000 },
    source: 'Financial Analysis',
    actionable: true,
    action_label: 'Ver Finanzas',
    action_url: '/financial',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    dismissed: false
  },
  {
    id: 'alert-6',
    alert_type: 'integration_sync',
    severity: 'info' as const,
    title: 'Sincronización Completada',
    message: 'Google Calendar se ha sincronizado correctamente con 12 nuevos eventos.',
    context: { events_synced: 12, integration: 'Google Calendar' },
    source: 'Integrations',
    actionable: false,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    dismissed: false
  }
];
