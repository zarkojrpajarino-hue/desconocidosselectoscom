import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User, TrendingUp, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense' | 'marketing';
  amount: number;
  description: string;
  category?: string;
  created_by_name?: string;
  created_by?: string;
}

interface UserTransactionStats {
  user_id: string;
  user_name: string;
  total_transactions: number;
  total_revenue: number;
  total_expenses: number;
  total_marketing: number;
}

const TransactionsHistory = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userStats, setUserStats] = useState<UserTransactionStats[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        fetchTransactions(),
        fetchUserStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Fetch all revenue entries
      const { data: revenueData } = await supabase
        .from('revenue_entries')
        .select(`
          id, 
          date, 
          amount, 
          product_category, 
          product_name,
          created_by,
          users!revenue_entries_created_by_fkey(full_name)
        `)
        .order('date', { ascending: false });

      // Fetch all expense entries
      const { data: expenseData } = await supabase
        .from('expense_entries')
        .select(`
          id, 
          date, 
          amount, 
          category, 
          description,
          created_by,
          users!expense_entries_created_by_fkey(full_name)
        `)
        .order('date', { ascending: false });

      // Fetch all marketing spend
      const { data: marketingData } = await supabase
        .from('marketing_spend')
        .select(`
          id, 
          date, 
          amount, 
          channel,
          created_by,
          users!marketing_spend_created_by_fkey(full_name)
        `)
        .order('date', { ascending: false });

      const allTransactions: Transaction[] = [
        ...(revenueData || []).map(r => ({
          id: r.id,
          date: r.date,
          type: 'revenue' as const,
          amount: r.amount,
          description: r.product_name || r.product_category,
          category: r.product_category,
          created_by_name: r.users?.full_name || 'Usuario desconocido',
          created_by: r.created_by
        })),
        ...(expenseData || []).map(e => ({
          id: e.id,
          date: e.date,
          type: 'expense' as const,
          amount: e.amount,
          description: e.description,
          category: e.category,
          created_by_name: e.users?.full_name || 'Usuario desconocido',
          created_by: e.created_by
        })),
        ...(marketingData || []).map(m => ({
          id: m.id,
          date: m.date,
          type: 'marketing' as const,
          amount: m.amount,
          description: `Campaña ${m.channel}`,
          category: m.channel,
          created_by_name: m.users?.full_name || 'Usuario desconocido',
          created_by: m.created_by
        }))
      ];

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get all users with admin or leader role
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('role', ['admin', 'leader']);

      if (!users) return;

      const stats: UserTransactionStats[] = [];

      for (const u of users) {
        // Count revenue entries
        const { count: revenueCount, data: revenueData } = await supabase
          .from('revenue_entries')
          .select('amount', { count: 'exact' })
          .eq('created_by', u.id);

        // Count expense entries
        const { count: expenseCount, data: expenseData } = await supabase
          .from('expense_entries')
          .select('amount', { count: 'exact' })
          .eq('created_by', u.id);

        // Count marketing entries
        const { count: marketingCount, data: marketingData } = await supabase
          .from('marketing_spend')
          .select('amount', { count: 'exact' })
          .eq('created_by', u.id);

        const totalTransactions = (revenueCount || 0) + (expenseCount || 0) + (marketingCount || 0);
        
        const totalRevenue = (revenueData || []).reduce((sum, r) => sum + (r.amount || 0), 0);
        const totalExpenses = (expenseData || []).reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalMarketing = (marketingData || []).reduce((sum, m) => sum + (m.amount || 0), 0);

        stats.push({
          user_id: u.id,
          user_name: u.full_name,
          total_transactions: totalTransactions,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          total_marketing: totalMarketing
        });
      }

      // Sort: current user first, then by total transactions
      stats.sort((a, b) => {
        if (a.user_id === user?.id) return -1;
        if (b.user_id === user?.id) return 1;
        return b.total_transactions - a.total_transactions;
      });

      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  // Check permissions
  if (userProfile?.role !== 'admin' && userProfile?.role !== 'leader') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Solo administradores y líderes pueden ver el historial de transacciones
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentUserStats = userStats.find(s => s.user_id === user?.id);
  const otherUsersStats = userStats.filter(s => s.user_id !== user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Historial de Transacciones
                </h1>
                <p className="text-sm text-muted-foreground">
                  Registro completo de todas las transacciones financieras
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/financial')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Panel
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Historial completo de transacciones */}
        <Card>
          <CardHeader>
            <Collapsible open={transactionsOpen} onOpenChange={setTransactionsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      📜 Todas las Transacciones ({transactions.length})
                    </CardTitle>
                    <CardDescription>
                      Historial completo de transacciones registradas por el equipo
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    {transactionsOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver todas
                      </>
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Fecha</th>
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-left py-3 px-4">Descripción</th>
                        <th className="text-left py-3 px-4">Categoría</th>
                        <th className="text-right py-3 px-4">Monto</th>
                        <th className="text-left py-3 px-4">Registrado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay transacciones registradas
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
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {transaction.created_by_name}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Estadísticas por Usuario */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">📊 Transacciones por Usuario</h2>

          {/* Usuario actual */}
          {currentUserStats && (
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Tú ({currentUserStats.user_name})</CardTitle>
                      <CardDescription>Tus transacciones registradas</CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/financial/transactions/user/${currentUserStats.user_id}`)}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Ver todas tus transacciones
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Transacciones</p>
                    <p className="text-2xl font-bold">{currentUserStats.total_transactions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ingresos Registrados</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(currentUserStats.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gastos Registrados</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(currentUserStats.total_expenses)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Marketing Registrado</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(currentUserStats.total_marketing)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Otros usuarios */}
          {otherUsersStats.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mt-8">Otros Miembros del Equipo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherUsersStats.map((stat) => (
                  <Card key={stat.user_id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{stat.user_name}</CardTitle>
                            <CardDescription className="text-xs">
                              {stat.total_transactions} transacciones registradas
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/financial/transactions/user/${stat.user_id}`)}
                          className="gap-2"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Ver transacciones
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Ingresos</p>
                          <p className="font-semibold text-success">{formatCurrency(stat.total_revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Gastos</p>
                          <p className="font-semibold text-destructive">{formatCurrency(stat.total_expenses)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Marketing</p>
                          <p className="font-semibold text-warning">{formatCurrency(stat.total_marketing)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransactionsHistory;
