import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense' | 'marketing';
  amount: number;
  description: string;
  category?: string;
}

interface UserInfo {
  full_name: string;
  role: string;
}

const UserTransactionsHistory = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading, currentOrganizationId, userOrganizations } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Obtener el rol actual del usuario en la organización seleccionada
  const currentUserRole = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role || 'member';
  const canViewTransactions = currentUserRole === 'admin' || currentUserRole === 'leader';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userId && user) {
      fetchUserData();
    }
  }, [userId, user]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    setLoadingData(true);
    try {
      // Fetch user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUserInfo(userData);

      // Fetch user's transactions
      await fetchUserTransactions();
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos del usuario');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchUserTransactions = async () => {
    if (!userId) return;

    try {
      // Fetch revenue entries
      const { data: revenueData } = await supabase
        .from('revenue_entries')
        .select('id, date, amount, product_category, product_name')
        .eq('created_by', userId)
        .order('date', { ascending: false });

      // Fetch expense entries
      const { data: expenseData } = await supabase
        .from('expense_entries')
        .select('id, date, amount, category, description')
        .eq('created_by', userId)
        .order('date', { ascending: false });

      // Fetch marketing spend
      const { data: marketingData } = await supabase
        .from('marketing_spend')
        .select('id, date, amount, channel')
        .eq('created_by', userId)
        .order('date', { ascending: false });

      const allTransactions: Transaction[] = [
        ...(revenueData || []).map(r => ({
          id: r.id,
          date: r.date,
          type: 'revenue' as const,
          amount: r.amount,
          description: r.product_name || r.product_category,
          category: r.product_category
        })),
        ...(expenseData || []).map(e => ({
          id: e.id,
          date: e.date,
          type: 'expense' as const,
          amount: e.amount,
          description: e.description,
          category: e.category
        })),
        ...(marketingData || []).map(m => ({
          id: m.id,
          date: m.date,
          type: 'marketing' as const,
          amount: m.amount,
          description: `Campaña ${m.channel}`,
          category: m.channel
        }))
      ];

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      revenue: 'Ingreso',
      expense: 'Gasto',
      marketing: 'Marketing'
    };
    return labels[type as keyof typeof labels];
  };

  const getTypeColor = (type: string) => {
    const colors = {
      revenue: 'default',
      expense: 'destructive',
      marketing: 'secondary'
    };
    return colors[type as keyof typeof colors] as 'default' | 'destructive' | 'secondary';
  };

  // Calculate stats
  const totalRevenue = transactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalMarketing = transactions
    .filter(t => t.type === 'marketing')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  // Check permissions
  if (!canViewTransactions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Solo administradores y líderes pueden ver transacciones de usuarios
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                  Trans. de {userInfo?.full_name || 'Usuario'}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Historial de transacciones
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/financial/transactions')}
              className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Volver</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl space-y-4 md:space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gastos Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Marketing Registrado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-warning">{formatCurrency(totalMarketing)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>📜 Todas las Transacciones ({transactions.length})</CardTitle>
            <CardDescription>
              Historial completo de transacciones registradas por {userInfo?.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Fecha</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Descripción</th>
                    <th className="text-left py-3 px-4">Categoría</th>
                    <th className="text-right py-3 px-4">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Este usuario no ha registrado transacciones
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm">{formatDate(transaction.date)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getTypeColor(transaction.type)}>
                            {getTypeLabel(transaction.type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">{transaction.description}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                          {transaction.category}
                        </td>
                        <td className={`text-right py-3 px-4 font-semibold ${
                          transaction.type === 'revenue' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserTransactionsHistory;
