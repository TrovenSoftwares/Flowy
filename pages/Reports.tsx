import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import { formatDate } from '../utils/utils';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'this_month',
    origin: 'all',
    reportType: 'cashflow'
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    balance: 0,
    totalTransactions: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (filters.period === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (filters.period === '90_days') {
        startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        endDate = now;
      } else if (filters.period === 'this_year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
      }

      let query = supabase
        .from('transactions')
        .select(`*, categories (name, color, icon)`)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Apply origin filter
      if (filters.origin === 'ai') {
        query = query.eq('is_ai', true);
      } else if (filters.origin === 'manual') {
        query = query.eq('is_ai', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      const trans = data || [];
      setTransactions(trans);

      // Calculate Stats
      const revenue = trans.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
      const expenses = trans.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);

      setStats({
        revenue,
        expenses,
        balance: revenue - expenses,
        totalTransactions: trans.length
      });

      // Chart Data (grouped by week or month)
      const chartMap = new Map();
      if (filters.period === '90_days' || filters.period === 'this_year') {
        for (let i = 0; i < (filters.period === 'this_year' ? 12 : 3); i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
          chartMap.set(label, { label, income: 0, expense: 0 });
        }
      } else {
        ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].forEach(label => {
          chartMap.set(label, { label, income: 0, expense: 0 });
        });
      }

      trans.forEach(t => {
        const d = new Date(t.date);
        let label = '';
        if (filters.period === '90_days' || filters.period === 'this_year') {
          label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
        } else {
          const day = d.getDate();
          if (day <= 7) label = 'Sem 1';
          else if (day <= 14) label = 'Sem 2';
          else if (day <= 21) label = 'Sem 3';
          else label = 'Sem 4';
        }
        if (chartMap.has(label)) {
          const entry = chartMap.get(label);
          if (t.type === 'income') entry.income += Number(t.value);
          else entry.expense += Number(t.value);
        }
      });

      const charts = Array.from(chartMap.values()).reverse();
      const maxVal = Math.max(...charts.map(c => Math.max(c.income, c.expense)), 100);
      const normalized = charts.map(c => ({
        ...c,
        incomeH: `${Math.max((c.income / maxVal) * 100, 3)}%`,
        expenseH: `${Math.max((c.expense / maxVal) * 100, 3)}%`
      }));
      setChartData(normalized);

    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Helper: Format Money
    const fmt = (val: number) => "R$\u00A0" + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const periodStr = filters.period === 'this_month' ? 'Mensal' : filters.period === 'last_month' ? 'Mês Passado' : 'Período Personalizado';

    if (filters.reportType === 'cashflow') {
      // -- PAGE 1: HEADER --
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(17, 24, 39);
      doc.text('Relatório de Fluxo de Caixa', margin, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Sistema: Versix ERP', margin, 26);

      // Period Info (Top Right)
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const now = new Date();
      doc.text(`Período: ${periodStr}`, pageWidth - margin, 20, { align: 'right' });
      doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')}`, pageWidth - margin, 25, { align: 'right' });

      // -- RESUMO GERAL (BOXES) --
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Resumo Geral', margin, 45);

      const boxWidth = (pageWidth - (margin * 2) - 15) / 4;
      const boxHeight = 25;
      const boxY = 52;

      const drawBox = (x: number, title: string, value: string, color: [number, number, number] = [17, 24, 39]) => {
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.1);
        doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'D');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(title, x + 5, boxY + 8);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(value, x + 5, boxY + 18);
      };

      drawBox(margin, 'Total Entradas', fmt(stats.revenue), [21, 128, 61]);
      drawBox(margin + boxWidth + 5, 'Total Saídas', fmt(stats.expenses), [185, 28, 28]);
      drawBox(margin + (boxWidth + 5) * 2, 'Resultado Op.', fmt(stats.balance), stats.balance >= 0 ? [21, 128, 61] : [185, 28, 28]);
      drawBox(margin + (boxWidth + 5) * 3, 'Movimentações', stats.totalTransactions.toString());

      // -- MOVIMENTAÇÕES TABLE --
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Movimentações Financeiras', margin, 95);

      const tableData = transactions.map(t => [
        formatDate(t.date),
        t.type === 'income' ? 'Entrada' : 'Saída',
        t.categories?.name || 'Geral',
        t.description?.substring(0, 40) || '---',
        t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        t.status === 'confirmed' ? 'Pago' : 'Pendente'
      ]);

      autoTable(doc, {
        startY: 102,
        head: [['DATA', 'TIPO', 'CATEGORIA', 'DESCRIÇÃO', 'VALOR (R$)', 'STATUS']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, textColor: [17, 24, 39], lineColor: [229, 231, 235] },
        headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' },
          5: { halign: 'center' }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const type = transactions[data.row.index].type;
            doc.setTextColor(type === 'income' ? 21 : 185, type === 'income' ? 128 : 28, type === 'income' ? 61 : 28);
          }
        }
      });
    } else {
      // -- PAGE: DRE --
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text('DRE – Demonstrativo de Resultado', margin, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Período: ${periodStr}`, margin, 27);

      // Grouping for DRE
      const revenue = stats.revenue;
      const taxes = transactions.filter(t => t.categories?.name?.toLowerCase().includes('imposto')).reduce((acc, t) => acc + Number(t.value), 0);
      const netRevenue = revenue - taxes;

      const costs = transactions.filter(t =>
        t.type === 'expense' &&
        (t.categories?.name?.toLowerCase().includes('fornecedor') || t.categories?.name?.toLowerCase().includes('custo'))
      ).reduce((acc, t) => acc + Number(t.value), 0);

      const grossProfit = netRevenue - costs;

      const admExpenses = transactions.filter(t =>
        t.type === 'expense' &&
        !t.categories?.name?.toLowerCase().includes('imposto') &&
        !t.categories?.name?.toLowerCase().includes('fornecedor') &&
        !t.categories?.name?.toLowerCase().includes('finan')
      ).reduce((acc, t) => acc + Number(t.value), 0);

      const finExpenses = transactions.filter(t =>
        t.type === 'expense' && t.categories?.name?.toLowerCase().includes('finan')
      ).reduce((acc, t) => acc + Number(t.value), 0);

      const opResult = grossProfit - admExpenses - finExpenses;
      const netProfit = opResult;

      const dreData = [
        ['Receita Bruta', fmt(revenue)],
        ['(-) Deduções / Impostos', `(${fmt(taxes)})`],
        ['RECEITA LÍQUIDA', fmt(netRevenue)],
        ['', ''],
        ['(-) Custos Operacionais', `(${fmt(costs)})`],
        ['LUCRO BRUTO', fmt(grossProfit)],
        ['', ''],
        ['(-) Despesas Administrativas', `(${fmt(admExpenses)})`],
        ['(-) Despesas Financeiras', `(${fmt(finExpenses)})`],
        ['RESULTADO OPERACIONAL', fmt(opResult)],
        ['', ''],
        ['LUCRO LÍQUIDO DO PERÍODO', fmt(netProfit)]
      ];

      autoTable(doc, {
        startY: 40,
        head: [['DESCRIÇÃO', 'VALOR (R$)']],
        body: dreData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 5, textColor: [17, 24, 39] },
        headStyles: { fillColor: [243, 244, 246], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' } },
        didParseCell: (data) => {
          const labelsToBold = ['RECEITA LÍQUIDA', 'LUCRO BRUTO', 'RESULTADO OPERACIONAL', 'LUCRO LÍQUIDO DO PERÍODO', 'Receita Bruta'];
          if (labelsToBold.includes(data.cell.text[0])) {
            data.cell.styles.fontStyle = 'bold';
            if (data.column.index === 1) data.cell.styles.textColor = [21, 128, 61];
          }
          if (data.cell.text[0].startsWith('(-)')) {
            if (data.column.index === 1) data.cell.styles.textColor = [185, 28, 28];
          }
        }
      });
    }

    // -- FOOTER --
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Relatório gerado automaticamente • Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`relatorio_${filters.reportType}_${filters.period}.pdf`);
    toast.success('Relatório gerado com sucesso!');
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Relatórios Financeiros"
        description="Análises detalhadas do fluxo de caixa e resultados."
        actions={
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              <span>Exportar PDF</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Receita Total"
          value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Entradas no período"
          icon="trending_up"
          iconColor="text-emerald-500 bg-emerald-500/10"
          valueColor="text-emerald-600"
        />
        <StatCard
          label="Despesas Totais"
          value={`R$ ${stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Saídas no período"
          icon="trending_down"
          iconColor="text-rose-500 bg-rose-500/10"
          valueColor="text-rose-600"
        />
        <StatCard
          label="Resultado Líquido"
          value={`R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Lucro ou prejuízo"
          icon="account_balance_wallet"
          iconColor="text-primary bg-primary/10"
          valueColor={stats.balance >= 0 ? 'text-primary' : 'text-rose-600'}
        />
        <StatCard
          label="Transações"
          value={stats.totalTransactions.toString()}
          trend="Lançamentos totais"
          icon="receipt_long"
          iconColor="text-blue-500 bg-blue-500/10"
        />
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CustomSelect
              icon="calendar_today"
              value={filters.period}
              onChange={(val) => setFilters({ ...filters, period: val })}
              options={[
                { value: 'this_month', label: 'Este Mês' },
                { value: 'last_month', label: 'Mês Passado' },
                { value: '90_days', label: 'Últimos 90 Dias' },
                { value: 'this_year', label: 'Este Ano' }
              ]}
            />
            <CustomSelect
              icon="smart_toy"
              value={filters.origin}
              onChange={(val) => setFilters({ ...filters, origin: val })}
              options={[
                { value: 'all', label: 'Todas as Origens' },
                { value: 'ai', label: 'WhatsApp IA' },
                { value: 'manual', label: 'Manual' }
              ]}
            />
            <CustomSelect
              icon="assessment"
              value={filters.reportType}
              onChange={(val) => setFilters({ ...filters, reportType: val })}
              options={[
                { value: 'cashflow', label: 'Fluxo de Caixa' },
                { value: 'dre', label: 'DRE' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Conditional Content based on reportType */}
      {filters.reportType === 'cashflow' ? (
        <>
          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Análise de Fluxo de Caixa</h3>
                <p className="text-sm text-slate-500">Entradas vs Saídas por período</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-primary"></div>
                  <span className="text-slate-600 dark:text-slate-400">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <span className="text-slate-600 dark:text-slate-400">Saídas</span>
                </div>
              </div>
            </div>

            <div className="w-full h-[200px] flex items-end justify-around gap-4">
              {chartData.length === 0 ? (
                <p className="text-slate-400 text-sm italic w-full text-center">Nenhum dado no período.</p>
              ) : (
                chartData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                    <div className="w-full flex gap-1 h-[160px] items-end justify-center">
                      <div
                        className="w-1/2 bg-gradient-to-t from-primary to-primary/70 rounded-t-md transition-all hover:from-primary hover:to-primary/90"
                        style={{ height: d.incomeH }}
                        title={`Receita: R$ ${d.income.toLocaleString('pt-BR')}`}
                      ></div>
                      <div
                        className="w-1/2 bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-t-md transition-all"
                        style={{ height: d.expenseH }}
                        title={`Despesa: R$ ${d.expense.toLocaleString('pt-BR')}`}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{d.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden overflow-x-auto">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalhamento das Transações</h3>
              <span className="text-xs font-bold text-slate-400 uppercase">{transactions.length} lançamentos</span>
            </div>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Data</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Descrição</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Categoria</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Origem</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Valor</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Carregando...</td></tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">Nenhuma transação encontrada.</td></tr>
                ) : (
                  paginatedTransactions.map(t => (
                    <tr key={t.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">{t.description}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {t.categories?.name || 'Geral'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.is_ai ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                          <span className="material-symbols-outlined text-[12px]">{t.is_ai ? 'smart_toy' : 'edit_note'}</span>
                          {t.is_ai ? 'IA' : 'Manual'}
                        </span>
                      </td>
                      <td className={`px-4 py-4 text-sm font-bold text-right whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {"R$\u00A0"}{Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {t.status === 'confirmed' ? (
                          <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center size-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                            <span className="material-symbols-outlined text-[16px]">pending</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Footer */}
            <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, transactions.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{transactions.length}</span> resultados
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-sm font-bold text-primary px-2">{currentPage} / {totalPages || 1}</span>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* DRE View */
        <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-8 max-w-4xl mx-auto">
          <div className="text-center mb-8 border-b border-gray-100 dark:border-slate-800 pb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Demonstrativo de Resultado do Exercício</h2>
            <p className="text-slate-500 uppercase text-xs font-bold tracking-widest">DRE Gerencial</p>
          </div>

          <div className="space-y-4">
            {(() => {
              const fmt = (v: number) => "R$\u00A0" + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              const revenue = stats.revenue;
              const taxes = transactions.filter(t => t.categories?.name?.toLowerCase().includes('imposto')).reduce((acc, t) => acc + Number(t.value), 0);
              const netRevenue = revenue - taxes;
              const costs = transactions.filter(t => t.type === 'expense' && (t.categories?.name?.toLowerCase().includes('fornecedor') || t.categories?.name?.toLowerCase().includes('custo'))).reduce((acc, t) => acc + Number(t.value), 0);
              const grossProfit = netRevenue - costs;
              const admExp = transactions.filter(t => t.type === 'expense' && !t.categories?.name?.toLowerCase().includes('imposto') && !t.categories?.name?.toLowerCase().includes('fornecedor') && !t.categories?.name?.toLowerCase().includes('finan')).reduce((acc, t) => acc + Number(t.value), 0);
              const finExp = transactions.filter(t => t.type === 'expense' && t.categories?.name?.toLowerCase().includes('finan')).reduce((acc, t) => acc + Number(t.value), 0);
              const opRes = grossProfit - admExp - finExp;

              const Row = ({ label, value, isBold, isTotal, isNegative }: any) => (
                <div className={`flex justify-between py-2 border-b border-gray-50 dark:border-slate-800/20 ${isBold ? 'font-bold' : ''} ${isTotal ? 'bg-slate-50 dark:bg-slate-900/30 px-4 rounded-lg my-1' : ''}`}>
                  <span className={isBold ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}>{label}</span>
                  <span className={`whitespace-nowrap ${isNegative ? 'text-rose-600' : isBold ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isNegative ? `(${fmt(value)})` : fmt(value)}
                  </span>
                </div>
              );

              return (
                <div className="flex flex-col gap-1">
                  <Row label="Receita Bruta" value={revenue} isBold />
                  <Row label="(-) Deduções / Impostos" value={taxes} isNegative />
                  <Row label="RECEITA LÍQUIDA" value={netRevenue} isBold isTotal />
                  <div className="h-4" />
                  <Row label="(-) Custos Operacionais" value={costs} isNegative />
                  <Row label="LUCRO BRUTO" value={grossProfit} isBold isTotal />
                  <div className="h-4" />
                  <Row label="(-) Despesas Administrativas" value={admExp} isNegative />
                  <Row label="(-) Despesas Financeiras" value={finExp} isNegative />
                  <Row label="RESULTADO OPERACIONAL" value={opRes} isBold isTotal />
                  <div className="h-4" />
                  <Row label="LUCRO LÍQUIDO DO PERÍODO" value={opRes} isBold isTotal />
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component - Premium style
const StatCard = ({ label, value, trend, icon, iconColor, valueColor }: any) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 shadow-sm group hover:border-primary/30 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined ${iconColor} p-2 rounded-lg`}>{icon}</span>
    </div>
    <p className={`text-2xl sm:text-3xl font-bold ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</p>
    <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
      <span className="material-symbols-outlined text-sm">info</span> {trend}
    </p>
  </div>
);

export default Reports;