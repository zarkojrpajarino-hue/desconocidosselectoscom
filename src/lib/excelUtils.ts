import { Lead, UserLeadStats } from '@/types';
import { formatDate } from './dateUtils';

/**
 * Exporta leads a formato Excel (CSV compatible)
 * Compatible con Excel, Google Sheets, LibreOffice
 */
export const exportLeadsToExcel = (leads: Lead[], filename = 'leads_export') => {
  if (!leads || leads.length === 0) {
    alert('No hay leads para exportar');
    return;
  }

  // Definir columnas profesionales
  const headers = [
    'ID',
    'Nombre',
    'Empresa',
    'Email',
    'Teléfono',
    'Cargo',
    'Tipo',
    'Calificación',
    'Estado',
    'Etapa Pipeline',
    'Fuente',
    'Valor Estimado (€)',
    'Probabilidad (%)',
    'Productos',
    'Próxima Acción',
    'Fecha Próxima',
    'Prioridad',
    'Creado Por',
    'Fecha Creación',
    'Asignado A',
    'Última Actualización',
    'Último Contacto',
    'Etiquetas',
    'Notas'
  ];

  // Mapear tipos a etiquetas
  const typeLabels: Record<string, string> = {
    cold: 'Frío', warm: 'Templado', hot: 'Caliente', mql: 'MQL', sql: 'SQL'
  };

  const statusLabels: Record<string, string> = {
    new: 'Nuevo', lead: 'Lead', contacted: 'Contactado', qualified: 'Calificado',
    proposal: 'Propuesta', negotiation: 'Negociación', won: 'Ganado', lost: 'Perdido', on_hold: 'En Espera'
  };

  const stageLabels: Record<string, string> = {
    discovery: 'Descubrimiento', demo: 'Demo', proposal: 'Propuesta',
    negotiation: 'Negociación', closed_won: 'Ganado', closed_lost: 'Perdido'
  };

  const priorityLabels: Record<string, string> = {
    urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja'
  };

  // Convertir leads a filas CSV
  const rows = leads.map(lead => [
    lead.id,
    lead.name,
    lead.company || '',
    lead.email || '',
    lead.phone || '',
    lead.position || '',
    typeLabels[lead.lead_type] || lead.lead_type,
    lead.lead_score,
    statusLabels[lead.stage] || lead.stage,
    stageLabels[lead.pipeline_stage] || lead.pipeline_stage,
    lead.source,
    lead.estimated_value?.toFixed(2) || '0.00',
    lead.probability,
    lead.interested_products?.join(', ') || '',
    lead.next_action || '',
    lead.next_action_date ? formatDate(lead.next_action_date) : '',
    priorityLabels[lead.priority] || lead.priority,
    lead.creator?.full_name || 'N/A',
    formatDate(lead.created_at),
    lead.assignee?.full_name || lead.assigned_to_name || '',
    formatDate(lead.updated_at),
    lead.last_contact_date ? formatDate(lead.last_contact_date) : '',
    lead.tags?.join(', ') || '',
    lead.notes?.replace(/\n/g, ' ').replace(/"/g, '""') || ''
  ]);

  // Crear CSV con UTF-8 BOM para Excel
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta estadísticas de usuarios a Excel
 */
export const exportUserStatsToExcel = (stats: UserLeadStats[], filename = 'user_lead_stats') => {
  if (!stats || stats.length === 0) {
    alert('No hay estadísticas para exportar');
    return;
  }

  const headers = [
    'Usuario',
    'Rol',
    'Total Leads',
    'Leads Ganados',
    'Leads Calientes',
    'Valor Total Ganado (€)',
    'Valor Pipeline (€)'
  ];

  const roleLabels: Record<string, string> = {
    admin: 'Admin', leader: 'Líder', employee: 'Empleado'
  };

  const rows = stats.map(stat => [
    stat.full_name,
    roleLabels[stat.role] || stat.role,
    stat.total_leads,
    stat.won_leads,
    stat.hot_leads,
    stat.total_won_value?.toFixed(2) || '0.00',
    stat.total_pipeline_value?.toFixed(2) || '0.00'
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
