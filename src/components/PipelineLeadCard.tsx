import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Calendar } from 'lucide-react';
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
  
  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case 'hot': return '🔥';
      case 'warm': return '🌡️';
      case 'cold': return '❄️';
      case 'mql': return '📊';
      case 'sql': return '💼';
      default: return '📌';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-l-red-500';
      case 'high': return 'border-l-4 border-l-orange-500';
      case 'medium': return 'border-l-4 border-l-blue-500';
      case 'low': return 'border-l-4 border-l-gray-500';
      default: return '';
    }
  };

  const getScoreBadgeColor = (score: string) => {
    switch (score) {
      case 'A': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'D': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return 'bg-muted text-muted-foreground';
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

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => onClick(lead)}
      className={`
        cursor-grab active:cursor-grabbing
        hover:shadow-lg hover:scale-[1.02]
        transition-all duration-200
        ${getPriorityColor(lead.priority)}
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      <CardContent className="p-3 space-y-2">
        {/* Lead Name & Type Icon */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2 flex-1">
            {lead.name}
          </h4>
          <span className="text-lg flex-shrink-0">
            {getLeadTypeIcon(lead.lead_type)}
          </span>
        </div>

        {/* Company */}
        {lead.company && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {lead.company}
          </p>
        )}

        {/* Value & Probability */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-success" />
            <span className="font-semibold">
              {formatCurrency(lead.estimated_value || 0)}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {lead.probability}%
          </Badge>
        </div>

        {/* Assigned To */}
        {lead.assigned_user_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="line-clamp-1">
              {formatUserWithRole(lead.assigned_user_name, assignedUserRole)}
            </span>
          </div>
        )}

        {/* Lead Score */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline"
            className={`text-xs ${getScoreBadgeColor(lead.lead_score)}`}
          >
            Score: {lead.lead_score}
          </Badge>
        </div>

        {/* Created Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(lead.created_at, 'd MMM')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineLeadCard;
