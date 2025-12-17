import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Calendar, Building2, GripVertical, TrendingUp } from 'lucide-react';
import { Lead } from '@/types';
import { formatDate } from '@/lib/dateUtils';
import { useUserRoleName, formatUserWithRole } from '@/hooks/useUserRoles';

interface PipelineLeadCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onClick: (lead: Lead) => void;
  isDragging: boolean;
}

const PipelineLeadCard = ({ lead, onDragStart, onClick, isDragging }: PipelineLeadCardProps) => {
  const assignedUserRole = useUserRoleName(lead.assigned_to);
  
  const getLeadTypeConfig = (type: string) => {
    switch (type) {
      case 'hot': 
        return { icon: '🔥', label: 'Caliente', bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' };
      case 'warm': 
        return { icon: '🌡️', label: 'Templado', bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' };
      case 'cold': 
        return { icon: '❄️', label: 'Frío', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' };
      case 'mql': 
        return { icon: '📊', label: 'MQL', bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30' };
      case 'sql': 
        return { icon: '💼', label: 'SQL', bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' };
      default: 
        return { icon: '📌', label: 'Lead', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent': 
        return { color: 'bg-red-500', label: 'Urgente', glow: 'shadow-red-500/20' };
      case 'high': 
        return { color: 'bg-orange-500', label: 'Alta', glow: 'shadow-orange-500/20' };
      case 'medium': 
        return { color: 'bg-blue-500', label: 'Media', glow: 'shadow-blue-500/20' };
      case 'low': 
        return { color: 'bg-slate-400', label: 'Baja', glow: '' };
      default: 
        return { color: 'bg-slate-400', label: '', glow: '' };
    }
  };

  const getScoreConfig = (score: string) => {
    switch (score) {
      case 'A': 
        return { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-white', label: 'A' };
      case 'B': 
        return { bg: 'bg-gradient-to-r from-blue-400 to-blue-500', text: 'text-white', label: 'B' };
      case 'C': 
        return { bg: 'bg-gradient-to-r from-slate-400 to-slate-500', text: 'text-white', label: 'C' };
      case 'D': 
        return { bg: 'bg-gradient-to-r from-slate-300 to-slate-400', text: 'text-white', label: 'D' };
      default: 
        return { bg: 'bg-muted', text: 'text-muted-foreground', label: score };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const typeConfig = getLeadTypeConfig(lead.lead_type);
  const priorityConfig = getPriorityConfig(lead.priority);
  const scoreConfig = getScoreConfig(lead.lead_score);

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => onClick(lead)}
      className={`
        group cursor-grab active:cursor-grabbing
        bg-card hover:bg-accent/5
        border border-border/50 hover:border-border
        shadow-sm hover:shadow-md
        transition-all duration-200 ease-out
        ${isDragging ? 'opacity-40 scale-95 rotate-1' : 'hover:-translate-y-0.5'}
        relative overflow-hidden
      `}
    >
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 w-1 h-full ${priorityConfig.color} ${priorityConfig.glow}`} />
      
      <CardContent className="p-3 pl-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            <h4 className="font-semibold text-sm text-foreground line-clamp-1 flex-1">
              {lead.name}
            </h4>
          </div>
          <div className={`
            h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0
            ${typeConfig.bg} ${typeConfig.border} border
          `}>
            <span className="text-sm">{typeConfig.icon}</span>
          </div>
        </div>

        {/* Company */}
        {lead.company && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <Building2 className="h-3 w-3 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground line-clamp-1">
              {lead.company}
            </p>
          </div>
        )}

        {/* Value & Score Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5 p-2 rounded-lg bg-muted/30">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="font-bold text-sm text-foreground">
              {formatCurrency(lead.estimated_value || 0)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge 
              variant="outline" 
              className="text-xs font-medium px-1.5 py-0.5 h-auto border-border/50"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {lead.probability}%
            </Badge>
            <div className={`
              h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold
              ${scoreConfig.bg} ${scoreConfig.text}
            `}>
              {scoreConfig.label}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs">
          {lead.assigned_user_name ? (
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="truncate max-w-[100px]">
                {formatUserWithRole(lead.assigned_user_name, assignedUserRole)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/50">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs">Sin asignar</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(lead.created_at, 'd MMM')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineLeadCard;