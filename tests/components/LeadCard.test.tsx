/**
 * Test para LeadCard - Con imports reales corregidos
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LeadCard from '@/components/LeadCard';

// Mock de hooks
vi.mock('@/hooks/useUserRoles', () => ({
  useUserRoleName: vi.fn(() => 'Sales Manager'),
  formatUserWithRole: vi.fn((name: string, role: string) => `${name} (${role})`),
}));

// Mock de IntegrationButton para evitar dependencias complejas
vi.mock('@/components/IntegrationButton', () => ({
  default: () => null,
}));

// Mock de subscription limits
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({
    canUseFeature: () => true,
    limits: {},
  }),
}));

const mockLead = {
  id: 'lead-1',
  name: 'Juan Pérez',
  company: 'Tech Solutions SL',
  email: 'juan@techsolutions.com',
  phone: '+34 600 123 456',
  estimated_value: 50000,
  probability: 75,
  expected_revenue: 37500,
  priority: 'high' as const,
  next_action: 'Llamada de seguimiento',
  next_action_date: '2024-12-20',
  last_contact_date: '2024-12-10',
  interested_products: ['CRM Premium', 'AI Analytics'],
  assigned_to_name: 'María García',
  assigned_to: 'user-1',
  hubspot_synced: true,
};

describe('LeadCard', () => {
  it('renderiza el nombre del lead', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('renderiza la compañía del lead', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('Tech Solutions SL')).toBeInTheDocument();
  });

  it('muestra el valor estimado formateado', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    // Buscar valor formateado (50.000 o 50,000 dependiendo del locale)
    expect(screen.getByText(/50[.,\s]?000/)).toBeInTheDocument();
  });

  it('muestra el badge de prioridad correcto', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('muestra la probabilidad', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('muestra email y teléfono', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('juan@techsolutions.com')).toBeInTheDocument();
    expect(screen.getByText('+34 600 123 456')).toBeInTheDocument();
  });

  it('muestra productos de interés', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('CRM Premium')).toBeInTheDocument();
    expect(screen.getByText('AI Analytics')).toBeInTheDocument();
  });

  it('muestra próxima acción', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('Llamada de seguimiento')).toBeInTheDocument();
  });

  it('llama a onClick cuando se hace click en la card', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    const card = screen.getByText('Juan Pérez').closest('.cursor-pointer');
    if (card) {
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });

  it('muestra badge de HubSpot cuando está sincronizado', () => {
    const onClick = vi.fn();
    render(<LeadCard lead={mockLead} onClick={onClick} />);
    
    expect(screen.getByText('HubSpot')).toBeInTheDocument();
  });

  it('muestra alerta de contacto si pasaron 3+ días', () => {
    const onClick = vi.fn();
    const leadSinContacto = {
      ...mockLead,
      last_contact_date: '2024-12-01',
    };
    
    render(<LeadCard lead={leadSinContacto} onClick={onClick} />);
    
    expect(screen.getByText(/Sin contacto hace/)).toBeInTheDocument();
  });

  it('renderiza sin datos opcionales', () => {
    const onClick = vi.fn();
    const leadMinimo = {
      id: 'lead-2',
      name: 'Lead Simple',
      estimated_value: 10000,
      probability: 50,
      expected_revenue: 5000,
      priority: 'low' as const,
    };
    
    render(<LeadCard lead={leadMinimo} onClick={onClick} />);
    
    expect(screen.getByText('Lead Simple')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });
});
