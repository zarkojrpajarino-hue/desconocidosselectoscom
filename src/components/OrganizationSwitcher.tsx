// src/components/OrganizationSwitcher.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Building2, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const OrganizationSwitcher = () => {
  const { currentOrganizationId, userOrganizations, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const currentOrganization = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  );

  const handleSwitchOrg = (orgId: string) => {
    switchOrganization(orgId);
    setOpen(false);
  };

  const handleCreateNew = () => {
    setOpen(false);
    navigate('/onboarding');
  };

  const getPlanBadgeVariant = (plan: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (plan) {
      case 'trial':
        return 'secondary';
      case 'free':
        return 'outline';
      case 'starter':
      case 'professional':
      case 'enterprise':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      trial: 'Trial',
      free: 'Free',
      starter: 'Starter',
      professional: 'Pro',
      enterprise: 'Enterprise',
    };
    return labels[plan] || plan;
  };

  if (!currentOrganization || userOrganizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-border/50 hover:border-primary/50"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden md:inline max-w-[150px] truncate">
            {currentOrganization.organization_name}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Mis Organizaciones</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userOrganizations.length} {userOrganizations.length === 1 ? 'organización' : 'organizaciones'}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {userOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.organization_id}
            onClick={() => handleSwitchOrg(org.organization_id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {org.organization_id === currentOrganizationId && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {org.organization_name}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge
                      variant={getPlanBadgeVariant(org.plan)}
                      className="text-xs px-1.5 py-0"
                    >
                      {getPlanLabel(org.plan)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleCreateNew}
          className="cursor-pointer text-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Organización
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};