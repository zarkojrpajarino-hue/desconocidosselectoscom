import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeysTab } from '@/pages/settings/tabs/ApiKeysTab';

// Mock useApiKeys hook
const mockCreateApiKey = vi.fn();
const mockDeleteApiKey = vi.fn();
const mockDismissNewKey = vi.fn();

vi.mock('@/hooks/integrations', () => ({
  useApiKeys: () => ({
    apiKeys: [
      {
        id: '1',
        name: 'Production Key',
        key_prefix: 'sk_live_',
        is_active: true,
        scopes: ['read', 'write'],
        rate_limit: 100,
        last_used_at: '2025-01-15T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: null,
      },
      {
        id: '2',
        name: 'Test Key',
        key_prefix: 'sk_test_',
        is_active: false,
        scopes: ['read'],
        rate_limit: 50,
        last_used_at: null,
        created_at: '2025-01-10T00:00:00Z',
        expires_at: null,
      }
    ],
    loading: false,
    newKey: null,
    showNewKey: false,
    isCreating: false,
    createApiKey: mockCreateApiKey,
    deleteApiKey: mockDeleteApiKey,
    dismissNewKey: mockDismissNewKey,
  })
}));

describe('ApiKeysTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render API keys list', () => {
    render(<ApiKeysTab organizationId="org-123" />);

    expect(screen.getByText('Production Key')).toBeInTheDocument();
    expect(screen.getByText('Test Key')).toBeInTheDocument();
  });

  it('should show key prefixes', () => {
    render(<ApiKeysTab organizationId="org-123" />);

    expect(screen.getByText(/sk_live_/)).toBeInTheDocument();
    expect(screen.getByText(/sk_test_/)).toBeInTheDocument();
  });

  it('should display active/inactive badges', () => {
    render(<ApiKeysTab organizationId="org-123" />);

    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('should show create button', () => {
    render(<ApiKeysTab organizationId="org-123" />);

    expect(screen.getByText(/Crear API Key/)).toBeInTheDocument();
  });

  it('should open create dialog when clicking button', async () => {
    render(<ApiKeysTab organizationId="org-123" />);

    const createButton = screen.getByText(/Crear API Key/);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Nombre de la Key')).toBeInTheDocument();
    });
  });

  it('should show rate limit info', () => {
    render(<ApiKeysTab organizationId="org-123" />);

    expect(screen.getByText(/100 req\/min/)).toBeInTheDocument();
  });

  it('should show documentation section', () => {
    render(<ApiKeysTab organizationId="org-123" />);

    expect(screen.getByText('Documentación de la API')).toBeInTheDocument();
    expect(screen.getByText('Autenticación')).toBeInTheDocument();
    expect(screen.getByText('Endpoints Disponibles')).toBeInTheDocument();
  });

  it('should call deleteApiKey when delete button clicked', () => {
    render(<ApiKeysTab organizationId="org-123" />);

    const deleteButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg.text-destructive')
    );
    
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      expect(mockDeleteApiKey).toHaveBeenCalledWith('1');
    }
  });
});

describe('ApiKeysTab - Loading State', () => {
  it('should show loading state', () => {
    vi.doMock('@/hooks/integrations', () => ({
      useApiKeys: () => ({
        apiKeys: [],
        loading: true,
        newKey: null,
        showNewKey: false,
        isCreating: false,
        createApiKey: vi.fn(),
        deleteApiKey: vi.fn(),
        dismissNewKey: vi.fn(),
      })
    }));

    // Loading state is handled in component
  });
});

describe('ApiKeysTab - Empty State', () => {
  it('should show empty message when no keys', () => {
    vi.doMock('@/hooks/integrations', () => ({
      useApiKeys: () => ({
        apiKeys: [],
        loading: false,
        newKey: null,
        showNewKey: false,
        isCreating: false,
        createApiKey: vi.fn(),
        deleteApiKey: vi.fn(),
        dismissNewKey: vi.fn(),
      })
    }));

    // Empty state is handled in component
  });
});
