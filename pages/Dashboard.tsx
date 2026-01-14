import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WhatsAppIcon } from '../components/BrandedIcons';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/utils';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [stats, setStats] = React.useState({
    revenue: 0,
    expenses: 0,
    balance: 0,
    pendingAi: 0
  });
  const [recentTransactions, setRecentTransactions] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = React.useState<any[]>([]);

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      let monthsToFetch = 6;

      if (filter === 'annual') {
        startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
        endDate = new Date(now.getFullYear(), 11, 31); // Dec 31st
        monthsToFetch = 12;
      } else if (filter === 'quarterly') {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        const quarterEndMonth = quarterStartMonth + 3;
        endDate = new Date(now.getFullYear(), quarterEndMonth, 0);
        monthsToFetch = 3;
      } else { // monthly
        // For chart context: Last 6 months. For KPI: This month.
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthsToFetch = 6;
      }

      // Fetch transactions
      const { data: allTrans, error: transError } = await supabase
        .from('transactions')
        .select(`
          id, value, type, date, status, description,
          categories (name, color, icon)
        `)
        .eq('status', 'confirmed') // Only confirmed transactions
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (transError) throw transError;

      // KPI Calculations - Filter specific range for KPIs
      let kpiTrans = allTrans || [];

      if (filter === 'monthly') {
        kpiTrans = (allTrans || []).filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
      }

      // Logic Swap: 
      // Revenue (Receita) = Income (excluding Returns) + Bounced Checks (from Expense)
      // Expenses (Despesa) = Expenses (excluding Bounced Checks) + Returns (from Income)

      const revenue = kpiTrans.reduce((acc, t) => {
        // Safe category access
        const catList: any = t.categories;
        const catName = Array.isArray(catList) ? catList[0]?.name : catList?.name;

        const isReturn = catName === 'Devolução';
        const isBouncedCheck = t.description?.includes('Cheque Devolvido');

        if (t.type === 'income' && !isReturn) return acc + Number(t.value);
        if (t.type === 'expense' && isBouncedCheck) return acc + Number(t.value);
        return acc;
      }, 0);

      const expenses = kpiTrans.reduce((acc, t) => {
        // Safe category access
        const catList: any = t.categories;
        const catName = Array.isArray(catList) ? catList[0]?.name : catList?.name;

        const isReturn = catName === 'Devolução';
        const isBouncedCheck = t.description?.includes('Cheque Devolvido');

        if (t.type === 'expense' && !isBouncedCheck) return acc + Number(t.value);
        if (t.type === 'income' && isReturn) return acc + Number(t.value);
        return acc;
      }, 0);

      // Fetch Pending Messages with Monitoring Filter
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .in('category', ['Funcionário', 'Grupo'])
        .eq('whatsapp_monitoring', true);

      const monitoredJids: string[] = [];
      (contactsData || []).forEach(c => {
        if (c.is_group && c.whatsapp_id) {
          monitoredJids.push(c.whatsapp_id);
        } else if (!c.is_group && c.phone) {
          const phoneClean = c.phone.replace(/\D/g, '');
          monitoredJids.push(`${phoneClean}@s.whatsapp.net`);
          if (phoneClean.startsWith('55')) {
            monitoredJids.push(`${phoneClean.substring(2)}@s.whatsapp.net`);
          } else {
            monitoredJids.push(`55${phoneClean}@s.whatsapp.net`);
          }
        }
      });

      let pendingAiCount = 0;
      if (monitoredJids.length > 0) {
        const { data: pendingMsgs } = await supabase
          .from('whatsapp_messages')
          .select('remote_jid')
          .eq('status', 'pending');

        if (pendingMsgs) {
          pendingAiCount = pendingMsgs.filter(msg => {
            const msgJid = msg.remote_jid;
            return monitoredJids.some(jid => msgJid.includes(jid.split('@')[0]));
          }).length;
        }
      }

      setStats({
        revenue,
        expenses,
        balance: revenue - expenses,
        pendingAi: pendingAiCount
      });

      // Chart Data Building
      const monthsMap = new Map();

      // Determine chart start month based on filter/fetch
      // If annual, show all 12 months (even future empty ones? Maybe just up to now or full year structure)
      // Let's show relevant structure.

      let chartStart = new Date(startDate);
      // specific logic per filter for cleaner X-axis
      if (filter === 'monthly') {
        // ensure exactly last 6 months ending now
        chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      }

      for (let i = 0; i < monthsToFetch; i++) {
        const d = new Date(chartStart.getFullYear(), chartStart.getMonth() + i, 1);

        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
        monthsMap.set(key, { label, income: 0, expense: 0 });
      }

      allTrans?.forEach(t => {
        const [yearStr, monthStr] = t.date.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1;

        const key = `${year}-${month}`;
        if (monthsMap.has(key)) {
          const entry = monthsMap.get(key);
          if (t.type === 'income') entry.income += Number(t.value);
          else entry.expense += Number(t.value);
        }
      });

      const charts = Array.from(monthsMap.values());
      const maxVal = Math.max(...charts.map(c => Math.max(c.income, c.expense)), 100);
      const normalizedCharts = charts.map(c => ({
        ...c,
        incomeH: Math.max(Math.round((c.income / maxVal) * 100), 5),
        expenseH: Math.max(Math.round((c.expense / maxVal) * 100), 5)
      }));
      setChartData(normalizedCharts);

      // Category Data: Group by Category only for Expenses in KPI range
      const catMap = new Map();
      kpiTrans.filter(t => t.type === 'expense').forEach((t: any) => {
        const catName = t.categories?.name || 'Outros';
        const catColor = t.categories?.color || 'bg-slate-300';
        const val = Number(t.value);
        if (!catMap.has(catName)) {
          catMap.set(catName, { name: catName, value: 0, color: catColor });
        }
        catMap.get(catName).value += val;
      });

      const totalExpensesKPI = expenses || 1;
      const cats = Array.from(catMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 4)
        .map(c => ({
          ...c,
          percentage: Math.round((c.value / totalExpensesKPI) * 100),
          formatted: c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        }));
      setExpenseCategories(cats);


      // 2. Fetch Recent Transactions
      const { data: recent, error: recentError } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name, icon, color),
          accounts (name, icon, color)
        `)
        .order('date', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentTransactions(recent || []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Helper for Conic Gradient
  const getConicGradient = () => {
    if (expenseCategories.length === 0) return 'conic-gradient(#cbd5e1 0% 100%)';

    let gradient = 'conic-gradient(';
    let currentDeg = 0;

    expenseCategories.forEach((cat, i) => {
      const deg = (cat.value / (stats.expenses || 1)) * 360;
      // Map tailwind classes to hex for gradient (approximate)
      let color = '#cbd5e1'; // default slate-300
      // Enhanced color mapping for premium aesthetics
      if (cat.color.includes('emerald') || cat.color.includes('green')) color = '#10b981';
      else if (cat.color.includes('blue') || cat.color.includes('sky')) color = '#0ea5e9';
      else if (cat.color.includes('indigo')) color = '#6366f1';
      else if (cat.color.includes('violet') || cat.color.includes('purple')) color = '#8b5cf6';
      else if (cat.color.includes('rose') || cat.color.includes('red')) color = '#f43f5e';
      else if (cat.color.includes('amber') || cat.color.includes('orange')) color = '#f59e0b';
      else if (cat.color.includes('pink')) color = '#ec4899';
      else if (cat.color.includes('slate')) color = '#64748b';
      else color = '#3b82f6'; // Fallback to a nice blue

      gradient += `${color} ${currentDeg}deg ${currentDeg + deg}deg${i === expenseCategories.length - 1 ? '' : ', '}`;
      currentDeg += deg;
    });

    // Fill rest with slate if needed
    if (currentDeg < 360) {
      gradient += `, #f1f5f9 ${currentDeg}deg 360deg`;
    }

    gradient += ')';
    return gradient;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header Area */}
      {/* Header Area */}
      <div className="w-full py-4 border-b border-[#e7edf3] dark:border-slate-800">
        <PageHeader
          title="Dashboard"
          description="Bem-vindo de volta! Aqui está o resumo financeiro de hoje."
          actions={
            <div className="flex items-center w-full sm:w-auto bg-white dark:bg-slate-850 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilter('monthly')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors whitespace-nowrap ${filter === 'monthly' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setFilter('quarterly')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors whitespace-nowrap ${filter === 'quarterly' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Trimestral
              </button>
              <button
                onClick={() => setFilter('annual')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors whitespace-nowrap ${filter === 'annual' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Anual
              </button>
            </div>
          }
        />
      </div>

      <div className="space-y-6 pt-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Receita Período"
            value={loading ? '...' : `R$\u00A0${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            trend="0% vs mês anterior"
            icon="trending_up"
            iconColor="text-emerald-500 bg-emerald-500/10"
          />

          <StatCard
            label="Despesas Período"
            value={loading ? '...' : `R$\u00A0${stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            trend="0% vs mês anterior"
            icon="trending_down"
            iconColor="text-red-500 bg-red-500/10"
            valueColor="text-red-500"
            trendColor="text-red-500"
          />

          <StatCard
            label="Saldo Líquido"
            value={loading ? '...' : `R$\u00A0${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            trend="Consolidado"
            icon="account_balance_wallet"
            iconColor="text-primary bg-primary/10"
            valueColor={stats.balance >= 0 ? 'text-primary' : 'text-red-500'}
          />

          <div
            className="flex flex-col gap-1.5 sm:gap-2 rounded-xl p-4 sm:p-6 bg-slate-950 border border-slate-800 shadow-lg group hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden active:scale-95 min-w-0"
            onClick={() => navigate('/review')}
          >
            <div className="flex items-center justify-between relative z-10">
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pendências IA</p>
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-1.5 sm:p-2 rounded-lg text-lg sm:text-xl">smart_toy</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold tracking-tight text-white relative z-10">
              {loading ? '...' : `${stats.pendingAi} ${stats.pendingAi === 1 ? 'Item' : 'Itens'}`}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 relative z-10">
              <div className="bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs filled">warning</span>
                Atenção
              </div>
              <span className="text-slate-500 text-[10px] sm:text-xs">Revisão necessária</span>
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Main Chart & Sidebar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-850 p-6 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fluxo de Caixa</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Entradas e saídas nos últimos 6 meses</p>
              </div>
              <button className="text-primary hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
                Ver Detalhes <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="relative h-64 w-full px-2 sm:px-4">
              {/* Dynamic Bars */}
              <div className="absolute inset-x-2 sm:inset-x-4 bottom-6 top-4 flex items-end justify-between">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex items-end justify-center gap-0.5 sm:gap-1 h-full px-0.5 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {d.label}: In: {d.income.toLocaleString('pt-BR')} | Out: {d.expense.toLocaleString('pt-BR')}
                    </div>
                    <div
                      className={`${filter === 'annual' ? 'w-2 sm:w-3' : 'w-3 sm:w-4'} bg-slate-200 dark:bg-slate-700 rounded-t-sm transition-all duration-500 group-hover:bg-slate-300`}
                      style={{ height: `${d.expenseH}%` }}
                    ></div>
                    <div
                      className={`${filter === 'annual' ? 'w-2 sm:w-3' : 'w-3 sm:w-4'} bg-primary/80 rounded-t-sm transition-all duration-500 group-hover:bg-primary`}
                      style={{ height: `${d.incomeH}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-2 sm:left-4 right-2 sm:right-4 flex justify-between text-[10px] text-slate-400">
                {chartData.map((d, i) => (
                  <span key={i} className="flex-1 text-center">{d.label}</span>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-sm text-slate-600 dark:text-slate-300">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span className="text-sm text-slate-600 dark:text-slate-300">Despesas</span>
              </div>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Despesas por Categoria</h3>
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
              {/* CSS Donut Chart */}
              <div className="w-48 h-48 rounded-full relative flex items-center justify-center shadow-lg transform transition-all hover:scale-105" style={{ background: getConicGradient() }}>
                <div className="w-32 h-32 bg-white dark:bg-slate-850 rounded-full flex flex-col items-center justify-center z-10 shadow-inner">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</span>
                  <span className="text-xl font-bold text-slate-800 dark:text-white">R$ {stats.expenses.toLocaleString('pt-BR', { notation: 'compact' })}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {expenseCategories.length > 0 ? (
                expenseCategories.map((cat, i) => (
                  <CategoryLabel key={i} name={cat.name} percentage={cat.percentage} amount={cat.formatted} color={cat.color} />
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-4">Nenhuma despesa este mês.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#e7edf3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transações Recentes</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Últimos movimentos financeiros</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/transactions')}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">list</span>
                Ver Todos
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Descrição</th>
                  <th className="px-6 py-4 whitespace-nowrap">Categoria</th>
                  <th className="px-6 py-4 whitespace-nowrap">Origem</th>
                  <th className="px-6 py-4 whitespace-nowrap">Data</th>
                  <th className="px-6 py-4 whitespace-nowrap">Valor</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">Carregando transações...</td>
                  </tr>
                ) : recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">Nenhuma transação registrada.</td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      title={tx.description}
                      subtitle={tx.accounts?.name || 'Geral'}
                      category={tx.categories?.name || 'Sem Categoria'}
                      categoryIcon={tx.categories?.icon}
                      categoryColor={tx.categories?.color}
                      bankIcon={tx.accounts?.icon}
                      bankColor={tx.accounts?.color}
                      origin={tx.is_ai ? 'WhatsApp IA' : 'Manual'}
                      originIcon={tx.is_ai ? 'auto_awesome' : 'edit_note'}
                      date={formatDate(tx.date)}
                      value={`${tx.type === 'income' ? '+' : '-'} R$\u00A0${tx.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      status={tx.status === 'confirmed' ? 'success' : 'review'}
                      iconColor={tx.categories?.color || 'text-primary bg-blue-100 dark:bg-blue-900/30'}
                      valueColor={tx.type === 'income' ? 'text-primary' : 'text-red-500'}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};



const ChartBar = ({ label, income, expense, highlighted }: any) => (
  <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end group cursor-pointer">
    <div className="w-full max-w-[40px] flex gap-1 items-end h-full">
      <div
        className="w-1/2 bg-slate-300 dark:bg-slate-600 rounded-t-sm group-hover:bg-slate-400 transition-all relative"
        style={{ height: expense }}
      ></div>
      <div
        className={`w-1/2 bg-primary rounded-t-sm group-hover:bg-blue-400 transition-all relative ${highlighted ? 'shadow-[0_0_15px_rgba(19,127,236,0.3)]' : ''}`}
        style={{ height: income }}
      ></div>
    </div>
    <span className={`text-xs font-medium ${highlighted ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'}`}>{label}</span>
  </div>
);

const CategoryLabel = ({ name, percentage, amount, color }: any) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-2 min-w-0">
      <span className={`w-3 h-3 rounded-full shrink-0 ${color}`}></span>
      <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{name} ({percentage}%)</span>
    </div>
    <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">{"R$\u00A0"}{amount}</span>
  </div>
);

const TransactionRow = ({ title, subtitle, category, categoryIcon, categoryColor, bankIcon, bankColor, origin, originIcon, date, value, status, iconColor, valueColor, rowBg }: any) => {
  const navigate = useNavigate();
  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${rowBg || ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-lg ${iconColor} flex items-center justify-center shrink-0`}>
            {bankIcon && bankIcon.startsWith('/') ? (
              <img src={bankIcon} alt={subtitle} className="size-full object-cover rounded-lg" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">{categoryIcon || 'payments'}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{title}</p>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${category === 'Pendente' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
          {category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className={`flex items-center gap-1.5 font-medium text-xs ${origin === 'WhatsApp IA' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded w-fit border border-green-100 dark:border-green-900/30' : 'text-slate-500'}`}>
          {origin === 'WhatsApp IA' ? <WhatsAppIcon className="size-4" /> : originIcon && <span className="material-symbols-outlined text-[16px]">{originIcon}</span>}
          {origin}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500">{date}</td>
      <td className={`px-6 py-4 font-bold whitespace-nowrap ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</td>
      <td className="px-6 py-4 text-center">
        {status === 'success' ? (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
            <span className="material-symbols-outlined text-[16px] filled">check</span>
          </span>
        ) : status === 'review_sale' ? (
          <button
            onClick={() => navigate('/sales/review/12094')}
            className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded shadow-sm transition-colors font-bold"
          >
            Revisar Venda
          </button>
        ) : (
          <button
            onClick={() => navigate('/review')}
            className="text-xs bg-primary hover:bg-primary text-white px-3 py-1 rounded shadow-sm transition-colors"
          >
            Revisar
          </button>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </td>
    </tr>
  );
};

export default Dashboard;