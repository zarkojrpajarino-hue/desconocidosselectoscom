# ⚛️ React Query - Best Practices & Patterns

**Última actualización:** 2026-01-24

## 🎯 Objetivo

Estandarizar el uso de React Query en todos los hooks de data fetching para mejorar:
- **Performance** - Cache automático y revalidación inteligente
- **UX** - Loading states y error handling consistentes
- **Mantenibilidad** - Código predecible y fácil de debuggear
- **Testing** - Hooks más fáciles de testear

---

## 📐 Arquitectura de Hooks

### ✅ Pattern Correcto: React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 1. Query Keys (para cache management)
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// 2. Fetch Functions (separadas del hook)
async function fetchUsers(organizationId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) throw error;
  return data || [];
}

// 3. Hook usando React Query
export const useUsers = (organizationId: string) => {
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: userKeys.list(organizationId),
    queryFn: () => fetchUsers(organizationId),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    onError: (error: Error) => {
      toast.error('Error loading users');
    },
  });

  return { users, isLoading, error, refetch };
};
```

### ❌ Anti-Pattern: useState + useEffect

```typescript
// ❌ NO HACER ESTO
export const useUsers = (organizationId: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [organizationId]);

  return { users, loading, error, refetch: fetchUsers };
};
```

**Problemas:**
- ❌ No hay cache
- ❌ Re-fetch innecesarios
- ❌ No hay revalidación automática
- ❌ Loading states complejos
- ❌ Race conditions posibles
- ❌ Más código boilerplate

---

## 🔑 Query Keys

Las query keys son cruciales para el cache management.

### Estructura Jerárquica

```typescript
export const leadsKeys = {
  all: ['leads'] as const,
  lists: () => [...leadsKeys.all, 'list'] as const,
  list: (organizationId: string) => [...leadsKeys.lists(), { organizationId }] as const,
  details: () => [...leadsKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadsKeys.details(), id] as const,
  stats: (organizationId: string) => [...leadsKeys.all, 'stats', { organizationId }] as const,
};

// Uso:
leadsKeys.all                        // ['leads']
leadsKeys.list('org-1')              // ['leads', 'list', { organizationId: 'org-1' }]
leadsKeys.detail('lead-123')         // ['leads', 'detail', 'lead-123']
```

### Invalidación Inteligente

```typescript
// Invalidar TODOS los leads
queryClient.invalidateQueries({ queryKey: leadsKeys.all });

// Invalidar solo lists de leads
queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });

// Invalidar solo para una organización
queryClient.invalidateQueries({ queryKey: leadsKeys.list('org-1') });
```

---

## 🔄 Mutations

Para operaciones que modifican datos (POST, PUT, DELETE).

### Pattern Correcto

```typescript
export const useUsers = (organizationId: string) => {
  const queryClient = useQueryClient();

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (userData: CreateUserInput) => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: userKeys.list(organizationId) });
      toast.success('Usuario creado');
    },
    onError: (error: Error) => {
      toast.error('Error al crear usuario');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list(organizationId) });
      toast.success('Usuario eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar usuario');
    },
  });

  return {
    createUser: (data: CreateUserInput) => createMutation.mutate(data),
    deleteUser: (id: string) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
```

---

## ⚙️ Configuración Común

### staleTime

Tiempo que los datos se consideran "frescos" (no se re-fetch automáticamente).

```typescript
staleTime: 0,              // Siempre stale (default)
staleTime: 30 * 1000,      // 30 segundos
staleTime: 5 * 60 * 1000,  // 5 minutos
staleTime: Infinity,       // Nunca stale
```

**Recomendaciones:**
- Datos que cambian frecuentemente: 30s - 1min
- Datos que cambian ocasionalmente: 5min - 15min
- Datos casi estáticos: 1hr - Infinity

### cacheTime

Tiempo que los datos inactivos permanecen en cache.

```typescript
cacheTime: 5 * 60 * 1000,  // 5 minutos (default)
```

### enabled

Controla si la query se ejecuta.

```typescript
useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => fetchUser(userId),
  enabled: !!userId,  // Solo fetch si userId existe
});
```

### refetchOnWindowFocus

Re-fetch automático cuando el usuario vuelve a la ventana.

```typescript
refetchOnWindowFocus: true,   // Default
refetchOnWindowFocus: false,  // Deshabilitar
```

---

## 📝 Ejemplos Refactorizados

### useLeads

```typescript
// ✅ Refactorizado con React Query
export const useLeads = (userId: string | undefined, organizationId: string | null | undefined) => {
  const queryClient = useQueryClient();

  // Query para leads
  const { data: leads = [], isLoading, error, refetch } = useQuery({
    queryKey: leadsKeys.list(organizationId),
    queryFn: () => fetchLeads(userId, organizationId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  // Mutation para delete
  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.list(organizationId) });
      toast.success('Lead eliminado');
    },
  });

  return {
    leads,
    loading: isLoading,
    error,
    refetch,
    deleteLead: (id: string) => deleteMutation.mutate(id),
  };
};
```

### useFinancialData

```typescript
// ✅ Refactorizado con React Query
export const useFinancialData = () => {
  const { currentOrganizationId } = useAuth();

  // Query para transactions
  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: financialKeys.transactions(currentOrganizationId),
    queryFn: () => fetchTransactions(currentOrganizationId),
    enabled: !!currentOrganizationId,
    staleTime: 30 * 1000,
  });

  return { transactions, loading: isLoading, error, refetch };
};
```

---

## 🧪 Testing

React Query hooks son más fáciles de testear.

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads } from './useLeads';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('useLeads fetches leads', async () => {
  const { result } = renderHook(() => useLeads('user-1', 'org-1'), {
    wrapper: createWrapper(),
  });

  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.leads).toHaveLength(5);
});
```

---

## 📚 Checklist de Migración

Al refactorizar un hook a React Query:

- [ ] Crear query keys jerárquicas
- [ ] Separar fetch functions del hook
- [ ] Usar `useQuery` para lectura de datos
- [ ] Usar `useMutation` para escritura de datos
- [ ] Configurar `staleTime` apropiado
- [ ] Configurar `enabled` si hay dependencias
- [ ] Invalidar queries en mutations
- [ ] Manejar errores con `onError`
- [ ] Mantener API pública compatible
- [ ] Verificar que build pasa
- [ ] Actualizar tests si existen

---

## 🎓 Recursos

- [React Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)

---

**Refactorizados hasta ahora:**
- ✅ `useLeads` - CRM leads management
- ✅ `useFinancialData` - Financial transactions

**Por refactorizar (futuro):**
- ⏳ `useTasks` - Task management
- ⏳ `useOKRs` - OKRs management
- ⏳ Otros hooks con useState + useEffect

---

**Creado:** 2026-01-24
**Autor:** Claude Sonnet 4.5
