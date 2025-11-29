import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Euro,
  TrendingUp,
  User,
  AlertCircle
} from 'lucide-react';

interface LeadCardProps {
  lead: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    estimated_value: number;
    probability: number;
    expected_revenue: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    next_action?: string;
    next_action_date?: string;
    last_contact_date?: string;
    interested_products?: string[];
    assigned_to_name?: string;
  };
  onClick: () => void;
}

const LeadCard = ({ lead, onClick }: LeadCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-warning text-warning-foreground';
      case 'medium':
        return 'bg-primary text-primary-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
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

  const daysSinceContact = () => {
    if (!lead.last_contact_date) return null;
    const days = Math.floor(
      (new Date().getTime() - new Date(lead.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const contactDays = daysSinceContact();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all mb-3 hover:border-primary"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-3 px-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{lead.name}</h4>
              {lead.company && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">{lead.company}</span>
                </div>
              )}
            </div>
            <Badge 
              className={`${getPriorityColor(lead.priority)} text-xs px-2 py-0`}
            >
              {lead.priority}
            </Badge>
          </div>

          {/* Valor */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Euro className="w-4 h-4 text-success" />
              <span className="font-semibold text-success">
                {formatCurrency(lead.estimated_value)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>{lead.probability}%</span>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-1">
            {lead.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>

          {/* Productos */}
          {lead.interested_products && lead.interested_products.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.interested_products.slice(0, 2).map((product, idx) => (
                <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                  {product}
                </Badge>
              ))}
              {lead.interested_products.length > 2 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  +{lead.interested_products.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Próxima acción */}
          {lead.next_action_date && (
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              <span className="text-muted-foreground truncate">
                {lead.next_action || 'Próxima acción'}
              </span>
              <span className="text-primary font-medium">
                {new Date(lead.next_action_date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short'
                })}
              </span>
            </div>
          )}

          {/* Alerta de contacto */}
          {contactDays !== null && contactDays >= 3 && (
            <div className="flex items-center gap-1 text-xs text-warning">
              <AlertCircle className="w-3 h-3" />
              <span>Sin contacto hace {contactDays} días</span>
            </div>
          )}

          {/* Asignado a */}
          {lead.assigned_to_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
              <User className="w-3 h-3" />
              <span className="truncate">{lead.assigned_to_name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadCard;