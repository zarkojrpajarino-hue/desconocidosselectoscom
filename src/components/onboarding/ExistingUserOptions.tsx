import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Organization {
  organization_id: string;
  organization_name: string;
  role: string;
}

interface ExistingUserOptionsProps {
  userEmail: string;
  organizations: Organization[];
  onCreateNew: () => void;
}

export const ExistingUserOptions = ({ 
  userEmail, 
  organizations, 
  onCreateNew 
}: ExistingUserOptionsProps) => {
  const navigate = useNavigate();

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    if (role === 'admin') return 'default';
    if (role === 'ventas' || role === 'marketing') return 'secondary';
    return 'outline';
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      ventas: 'Ventas',
      marketing: 'Marketing',
      operaciones: 'Operaciones',
      custom: 'Personalizado'
    };
    return labels[role] || role;
  };

  const selectOrganization = (orgId: string) => {
    localStorage.setItem('current_organization_id', orgId);
    navigate('/dashboard/home');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Bienvenido de vuelta</h2>
        <p className="text-muted-foreground">
          Ya tienes una cuenta con {userEmail}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          ¿En qué empresa quieres trabajar?
        </p>
      </div>

      {/* Lista de organizaciones existentes */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Tus organizaciones:</h3>
        {organizations.map((org) => (
          <Card 
            key={org.organization_id}
            className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
            onClick={() => selectOrganization(org.organization_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{org.organization_name}</h4>
                  <Badge variant={getRoleBadgeVariant(org.role)} className="text-xs">
                    {getRoleLabel(org.role)}
                  </Badge>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {/* Botón crear nueva organización */}
      <div className="pt-4 border-t">
        <Button
          variant="outline"
          className="w-full py-6"
          onClick={onCreateNew}
        >
          <Plus className="mr-2 h-5 w-5" />
          Crear Nueva Organización
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Explica tu propia empresa y genera tu app personalizada
        </p>
      </div>
    </div>
  );
};
