// supabase/functions/_shared/email-templates.ts
/**
 * Sistema de Templates de Email para OPTIMUS-K
 * Templates reutilizables con branding correcto
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const APP_NAME = 'OPTIMUS-K';
const APP_URL = Deno.env.get('APP_URL') || 'https://optimusk.app';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'soporte@optimusk.app';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || `${APP_NAME} <noreply@optimusk.app>`;

// Colores del brand
const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#10b981',
  danger: '#ef4444',
  text: '#333333',
  textLight: '#6b7280',
  background: '#ffffff',
  border: '#e5e7eb',
};

// ═══════════════════════════════════════════════════════════════
// ESTILOS COMPARTIDOS
// ═══════════════════════════════════════════════════════════════

const emailStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: ${COLORS.text};
    margin: 0;
    padding: 0;
    background-color: #f3f4f6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: ${COLORS.background};
  }
  .header {
    background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
  .content {
    padding: 40px 30px;
  }
  .content p {
    margin: 16px 0;
  }
  .button {
    display: inline-block;
    background: ${COLORS.primary};
    color: white !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 24px 0;
    text-align: center;
  }
  .button:hover {
    background: ${COLORS.secondary};
  }
  .footer {
    background-color: #f9fafb;
    padding: 30px;
    text-align: center;
    color: ${COLORS.textLight};
    font-size: 14px;
    border-top: 1px solid ${COLORS.border};
  }
  .footer a {
    color: ${COLORS.primary};
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background-color: ${COLORS.border};
    margin: 24px 0;
  }
  ul {
    padding-left: 20px;
    margin: 16px 0;
  }
  li {
    margin: 10px 0;
    line-height: 1.6;
  }
  .badge {
    display: inline-block;
    background-color: #f3f4f6;
    color: ${COLORS.text};
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    margin: 4px;
  }
  .stat-card {
    background-color: #f9fafb;
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 16px;
    margin: 12px 0;
  }
  .stat-card h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: ${COLORS.textLight};
  }
  .stat-card .value {
    font-size: 32px;
    font-weight: 700;
    color: ${COLORS.primary};
    margin: 0;
  }
  @media only screen and (max-width: 600px) {
    .header h1 {
      font-size: 24px;
    }
    .content {
      padding: 24px 20px;
    }
    .button {
      display: block;
      width: 100%;
    }
  }
`;

// ═══════════════════════════════════════════════════════════════
// COMPONENTES REUTILIZABLES
// ═══════════════════════════════════════════════════════════════

const createHeader = (title: string, emoji?: string) => `
  <div class="header">
    <h1>${emoji ? emoji + ' ' : ''}${title}</h1>
  </div>
`;

const createButton = (url: string, text: string) => `
  <div style="text-align: center;">
    <a href="${url}" class="button">${text}</a>
  </div>
`;

const createFooter = (unsubscribeToken?: string) => `
  <div class="footer">
    <p>Este es un correo automático de ${APP_NAME}.</p>
    <p>
      <a href="${APP_URL}/settings/notifications">Gestionar preferencias</a>
      ${unsubscribeToken ? ` | <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}">Darme de baja</a>` : ''}
    </p>
    <p style="margin-top: 16px; font-size: 12px;">
      ${APP_NAME} - Sistema de Gestión Empresarial<br>
      ¿Necesitas ayuda? <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
    </p>
  </div>
`;

const createFeatureList = (features: string[]) => `
  <ul>
    ${features.map(feature => `<li>${feature}</li>`).join('')}
  </ul>
`;

const createStatCard = (label: string, value: string | number) => `
  <div class="stat-card">
    <h3>${label}</h3>
    <p class="value">${value}</p>
  </div>
`;

// ═══════════════════════════════════════════════════════════════
// TEMPLATE BASE
// ═══════════════════════════════════════════════════════════════

export const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${APP_NAME}</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`;

// ═══════════════════════════════════════════════════════════════
// TEMPLATE: WELCOME EMAIL
// ═══════════════════════════════════════════════════════════════

export interface WelcomeEmailData {
  userName: string;
  userRole: string;
  dashboardUrl?: string;
  unsubscribeToken?: string;
}

export const welcomeEmail = (data: WelcomeEmailData) => {
  const content = `
    ${createHeader(`¡Bienvenido a ${APP_NAME}!`, '🎉')}
    
    <div class="content">
      <p>Hola <strong>${data.userName}</strong>,</p>
      
      <p>Estamos emocionados de tenerte en ${APP_NAME}, tu sistema completo de gestión empresarial.</p>
      
      <h3>¿Qué puedes hacer con ${APP_NAME}?</h3>
      ${createFeatureList([
        '📊 <strong>CRM Completo:</strong> Gestiona leads, pipelines y oportunidades',
        '🎯 <strong>OKRs Inteligentes:</strong> Define y trackea objetivos con IA',
        '📋 <strong>Gestión de Tareas:</strong> Organiza tu equipo con workflows avanzados',
        '💰 <strong>Finanzas:</strong> Dashboards financieros y análisis en tiempo real',
        '🤖 <strong>IA Integrada:</strong> Asistente inteligente para decisiones',
        '📈 <strong>Analytics:</strong> Métricas y reportes automáticos'
      ])}

      <p><strong>Tu rol:</strong> <span class="badge">${data.userRole === 'admin' ? 'Administrador' : 'Miembro del equipo'}</span></p>
      
      ${createButton(data.dashboardUrl || `${APP_URL}/dashboard`, 'Acceder al Dashboard')}

      <div class="divider"></div>

      <p><strong>Próximos pasos:</strong></p>
      <ol>
        <li>Completa tu perfil de organización</li>
        <li>Invita a tu equipo</li>
        <li>Crea tu primer objetivo (OKR)</li>
        <li>Conecta tus herramientas favoritas</li>
      </ol>

      <p>Si tienes alguna pregunta, nuestro equipo está aquí para ayudarte.</p>
      
      <p>¡Mucho éxito!</p>
      <p><strong>El equipo de ${APP_NAME}</strong></p>
    </div>

    ${createFooter(data.unsubscribeToken)}
  `;

  return baseTemplate(content);
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE: WEEKLY SUMMARY
// ═══════════════════════════════════════════════════════════════

export interface WeeklySummaryData {
  userName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    tasksCompleted: number;
    leadsConverted: number;
    revenue: string;
    teamActivity: number;
  };
  topTasks: Array<{ title: string; status: string }>;
  dashboardUrl?: string;
  unsubscribeToken?: string;
}

export const weeklySummaryEmail = (data: WeeklySummaryData) => {
  const content = `
    ${createHeader('Tu Resumen Semanal', '📊')}
    
    <div class="content">
      <p>Hola <strong>${data.userName}</strong>,</p>
      
      <p>Aquí está tu resumen de actividad del <strong>${data.weekStart}</strong> al <strong>${data.weekEnd}</strong>.</p>

      <h3>📈 Métricas de la Semana</h3>
      
      ${createStatCard('Tareas Completadas', data.stats.tasksCompleted)}
      ${createStatCard('Leads Convertidos', data.stats.leadsConverted)}
      ${createStatCard('Revenue Generado', data.stats.revenue)}
      ${createStatCard('Actividad del Equipo', `${data.stats.teamActivity}%`)}

      <h3>🏆 Tareas Destacadas</h3>
      <ul>
        ${data.topTasks.map(task => `
          <li>
            <strong>${task.title}</strong>
            <span class="badge">${task.status}</span>
          </li>
        `).join('')}
      </ul>

      ${createButton(data.dashboardUrl || `${APP_URL}/dashboard`, 'Ver Dashboard Completo')}

      <p>¡Sigue así! 💪</p>
      <p><strong>El equipo de ${APP_NAME}</strong></p>
    </div>

    ${createFooter(data.unsubscribeToken)}
  `;

  return baseTemplate(content);
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE: URGENT ALERT
// ═══════════════════════════════════════════════════════════════

export interface UrgentAlertData {
  userName: string;
  alertTitle: string;
  alertMessage: string;
  severity: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  unsubscribeToken?: string;
}

export const urgentAlertEmail = (data: UrgentAlertData) => {
  const severityEmoji = {
    high: '🚨',
    medium: '⚠️',
    low: 'ℹ️'
  };

  const severityColor = {
    high: COLORS.danger,
    medium: '#f59e0b',
    low: COLORS.primary
  };

  const content = `
    <div style="background: ${severityColor[data.severity]}; color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">
        ${severityEmoji[data.severity]} ${data.alertTitle}
      </h1>
    </div>
    
    <div class="content">
      <p>Hola <strong>${data.userName}</strong>,</p>
      
      <p>${data.alertMessage}</p>

      ${data.actionUrl && data.actionLabel ? createButton(data.actionUrl, data.actionLabel) : ''}

      <p style="color: ${COLORS.textLight}; font-size: 14px;">
        Esta alerta fue generada automáticamente por ${APP_NAME}.
      </p>
    </div>

    ${createFooter(data.unsubscribeToken)}
  `;

  return baseTemplate(content);
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE: PASSWORD RESET
// ═══════════════════════════════════════════════════════════════

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

export const passwordResetEmail = (data: PasswordResetData) => {
  const content = `
    ${createHeader('Restablecer Contraseña', '🔐')}
    
    <div class="content">
      <p>Hola <strong>${data.userName}</strong>,</p>
      
      <p>Recibimos una solicitud para restablecer tu contraseña en ${APP_NAME}.</p>
      
      ${createButton(data.resetUrl, 'Restablecer Contraseña')}

      <p style="color: ${COLORS.textLight}; font-size: 14px;">
        Este enlace expira en <strong>${data.expiresIn}</strong>.
      </p>

      <div class="divider"></div>

      <p><strong>¿No solicitaste esto?</strong></p>
      <p>Puedes ignorar este correo de forma segura. Tu contraseña no cambiará.</p>

      <p>Por seguridad, nunca compartas este enlace con nadie.</p>
    </div>

    ${createFooter()}
  `;

  return baseTemplate(content);
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE: TEAM INVITE
// ═══════════════════════════════════════════════════════════════

export interface TeamInviteData {
  invitedByName: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
  unsubscribeToken?: string;
}

export const teamInviteEmail = (data: TeamInviteData) => {
  const content = `
    ${createHeader('Invitación a Equipo', '👥')}
    
    <div class="content">
      <p><strong>${data.invitedByName}</strong> te ha invitado a unirte a <strong>${data.organizationName}</strong> en ${APP_NAME}.</p>
      
      <p>Tu rol será: <span class="badge">${data.role}</span></p>

      ${createFeatureList([
        'Acceso completo a la plataforma',
        'Colaboración en tiempo real',
        'Dashboards personalizados',
        'Notificaciones inteligentes'
      ])}

      ${createButton(data.inviteUrl, 'Aceptar Invitación')}

      <p style="color: ${COLORS.textLight}; font-size: 14px;">
        Si no esperabas esta invitación, puedes ignorar este correo.
      </p>
    </div>

    ${createFooter(data.unsubscribeToken)}
  `;

  return baseTemplate(content);
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const emailConfig = {
  appName: APP_NAME,
  appUrl: APP_URL,
  supportEmail: SUPPORT_EMAIL,
  fromEmail: FROM_EMAIL,
};
