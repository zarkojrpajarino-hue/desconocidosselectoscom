import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft, FileText } from 'lucide-react';
import RevenueFormModal from '@/components/financial/RevenueFormModal';
import ExpenseFormModal from '@/components/financial/ExpenseFormModal';
import MarketingFormModal from '@/components/financial/MarketingFormModal';
import FinancialDashboard from '@/components/FinancialDashboard';

interface Transaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense' | 'marketing';
  amount: number;
  description: string;
  category?: string;
}

const DetailedFinancial = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [marketingModalOpen, setMarketingModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchRecentTransactions();
  }, [refreshKey]);

  const fetchRecentTransactions = async () => {
    try {
      // Fetch últimos ingresos
      const { data: revenueData } = await supabase
        .from('revenue_entries')
        .select('id, date, amount, product_category, product_name')
        .order('date', { ascending: false })
        .limit(10);

      // Fetch últimos gastos
      const { data: expenseData } = await supabase
        .from('expense_entries')
        .select('id, date, amount, category, description')
        .order('date', { ascending: false })
        .limit(10);

      // Fetch últimas campañas
      const { data: marketingData } = await supabase
        .from('marketing_spend')
        .select('id, date, amount, channel')
        .order('date', { ascending: false })
        .limit(10);

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

      // Ordenar por fecha descendente
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions.slice(0, 20));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Contabilidad Detallada
              </h1>
              <p className="text-sm text-muted-foreground">
                Registra transacciones y analiza métricas financieras detalladas
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
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
      {/* Botones de acción */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Transacción</CardTitle>
          <CardDescription>
            Registra ingresos, gastos o campañas de marketing manualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setRevenueModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Ingreso
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setExpenseModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Gasto
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setMarketingModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Campaña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard con datos detallados */}
      <div>
        <h3 className="text-2xl font-bold mb-4">Dashboard de Contabilidad Detallada</h3>
        <FinancialDashboard key={refreshKey} />
      </div>

      {/* Tabla de últimas transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
          <CardDescription>
            Historial de transacciones registradas manualmente
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
                      No hay transacciones registradas. Usa los botones de arriba para registrar la primera.
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

      {/* Modals */}
      <RevenueFormModal
        open={revenueModalOpen}
        onOpenChange={setRevenueModalOpen}
        onSuccess={handleSuccess}
      />
      <ExpenseFormModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        onSuccess={handleSuccess}
      />
      <MarketingFormModal
        open={marketingModalOpen}
        onOpenChange={setMarketingModalOpen}
        onSuccess={handleSuccess}
      />
        </div>
      </main>
    </div>
  );
};

export default DetailedFinancial;