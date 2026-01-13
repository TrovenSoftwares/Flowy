import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';
import EditTransactionModal from '../components/EditTransactionModal';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/utils';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expense: 0
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    period: 'Todo o período',
    category: 'Todas',
    account: 'Todas'
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete Modal State
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit Modal State
  const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name, icon, color),
          accounts (name, color, icon),
          contacts (name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);

      // Fetch categories for the dropdown
      const { data: cats } = await supabase.from('categories').select('id, name').order('name');
      setCategories(cats || []);

      // Fetch accounts for the dropdown
      const { data: accs } = await supabase.from('accounts').select('id, name').order('name');
      setAccounts(accs || []);

      const income = data?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0) || 0;
      const expense = data?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0) || 0;
      setStats({
        income,
        expense,
        balance: income - expense
      });

    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter(t => {
    const searchMatch = !filters.search ||
      t.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      t.id.toLowerCase().includes(filters.search.toLowerCase());

    const categoryMatch = filters.category === 'Todas' || t.categories?.name === filters.category;
    const accountMatch = filters.account === 'Todas' || t.accounts?.name === filters.account;

    let periodMatch = true;
    const now = new Date();
    const [yearStr, monthStr] = t.date.split('-');
    const txMonth = parseInt(monthStr) - 1;
    const txYear = parseInt(yearStr);

    if (filters.period === 'Este Mês') {
      periodMatch = txMonth === now.getMonth() && txYear === now.getFullYear();
    } else if (filters.period === 'Mês Passado') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodMatch = txMonth === lastMonthDate.getMonth() && txYear === lastMonthDate.getFullYear();
    } else if (filters.period === 'Últimos 7 dias') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      periodMatch = new Date(t.date) >= sevenDaysAgo;
    }

    return searchMatch && categoryMatch && accountMatch && periodMatch;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', transactionToDelete);
      if (error) throw error;

      toast.success('Transação excluída com sucesso.');
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir transação.');
    } finally {
      setDeleting(false);
      setTransactionToDelete(null);
    }
  };

  const exportToPDF = () => {
    if (filteredTransactions.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Helper: Format Money
    const fmt = (val: number) => "R$\u00A0" + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    // -- HEADER --
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Extrato de Transações', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Sistema: Versix ERP', margin, 26);

    // Filter Info (Top Right)
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const now = new Date();
    doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, pageWidth - margin, 20, { align: 'right' });
    doc.text(`Filtros: Periodo: ${filters.period} | Conta: ${filters.account}`, pageWidth - margin, 25, { align: 'right' });

    // -- STATS SUMMARY BOXES --
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);
    const balance = income - expense;

    const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
    const boxHeight = 20;
    const boxY = 35;

    const drawSummaryBox = (x: number, title: string, value: string, color: [number, number, number] = [30, 41, 59]) => {
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.1);
      doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'D');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(title, x + 5, boxY + 7);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(value, x + 5, boxY + 15);
    };

    drawSummaryBox(margin, 'Entradas', fmt(income), [5, 150, 105]);
    drawSummaryBox(margin + boxWidth + 5, 'Saídas', fmt(expense), [220, 38, 38]);
    drawSummaryBox(margin + (boxWidth + 5) * 2, 'Saldo Líquido', fmt(balance), balance > 0 ? [220, 38, 38] : [5, 150, 105]); // Red if > 0, Green if <= 0

    // -- TABLE --
    // Sort transactions oldest to newest for the report
    const sortedForReport = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const tableData = sortedForReport.map(t => {
      const value = Number(t.value);
      if (t.type === 'income') {
        runningBalance += value;
      } else {
        runningBalance -= value;
      }

      return [
        formatDate(t.date),
        t.description || '---',
        t.categories?.name || '---',
        t.accounts?.name || '---',
        t.type === 'income' ? 'Entrada' : 'Saída',
        fmt(value),
        fmt(runningBalance)
      ];
    });

    autoTable(doc, {
      startY: 62,
      head: [['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'CONTA', 'TIPO', 'VALOR', 'SALDO']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [30, 41, 59], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59], lineColor: [229, 231, 235] },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        const rowIndex = data.row.index;
        const tx = sortedForReport[rowIndex];

        if (data.section === 'body') {
          // Color for Value column (Index 5)
          if (data.column.index === 5) {
            data.cell.styles.textColor = tx.type === 'income' ? [5, 150, 105] : [220, 38, 38];
          }

          // Color for Running Balance column (Index 6)
          if (data.column.index === 6) {
            let rowBalance = 0;
            for (let i = 0; i <= rowIndex; i++) {
              const item = sortedForReport[i];
              const val = Number(item.value);
              if (item.type === 'income') rowBalance += val;
              else rowBalance -= val;
            }
            if (rowBalance > 0) data.cell.styles.textColor = [220, 38, 38]; // Red if > 0
            else if (rowBalance < 0) data.cell.styles.textColor = [5, 150, 105]; // Green if < 0
          }
        }
      }
    });

    // -- FOOTER --
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Extrato Versix ERP • Página ${i} de ${pageCount} • Gerado em ${now.toLocaleDateString('pt-BR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`Extrato_Transacoes_${format(now, 'dd_MM_yyyy')}.pdf`);
    toast.success('Extrato PDF gerado com sucesso!');
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Lista de Transações"
        description="Gerencie receitas e despesas de forma centralizada."
        actions={
          <div className="flex gap-3">
            <button
              onClick={exportToPDF}
              disabled={filteredTransactions.length === 0}
              className="flex items-center justify-center size-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 shadow-sm"
              title="Exportar Extrato PDF"
            >
              <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
            </button>
            <button
              onClick={fetchTransactions}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button
              onClick={() => navigate('/new-transaction')}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Nova Transação</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Receita Período" value={`R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} trend="Faturamento bruto" icon="payments" iconColor="text-emerald-500 bg-emerald-500/10" valueColor="text-emerald-500" />
        <StatCard label="Despesas Período" value={`R$ ${stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} trend="Total de saídas" icon="arrow_upward" iconColor="text-red-500 bg-red-500/10" valueColor="text-red-500" trendColor="text-red-500" />
        <StatCard label="Saldo Líquido" value={`R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} trend="Resultado final" icon="account_balance_wallet" iconColor="text-primary bg-primary/10" valueColor="text-slate-900 dark:text-white" />
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
              placeholder="Buscar por descrição ou ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <CustomSelect
              className="w-full sm:w-44"
              icon="calendar_today"
              value={filters.period}
              onChange={(val) => setFilters({ ...filters, period: val })}
              options={[
                { value: 'Todo o período', label: 'Todo o período' },
                { value: 'Este Mês', label: 'Este Mês' },
                { value: 'Mês Passado', label: 'Mês Passado' },
                { value: 'Últimos 7 dias', label: 'Últimos 7 dias' },
              ]}
            />
            <CustomSelect
              className="w-full sm:w-44"
              icon="category"
              value={filters.category}
              onChange={(val) => setFilters({ ...filters, category: val })}
              options={[
                { value: 'Todas', label: 'Todas Categorias' },
                ...categories.map(c => ({ value: c.name, label: c.name }))
              ]}
            />
            <CustomSelect
              className="w-full sm:w-44"
              icon="account_balance"
              value={filters.account}
              onChange={(val) => setFilters({ ...filters, account: val })}
              options={[
                { value: 'Todas', label: 'Todas as Contas' },
                ...accounts.map(a => ({ value: a.name, label: a.name }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <th className="py-4 pl-6 pr-3 w-12 text-center">
                <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
              </th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Descrição / Conta</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Categoria</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Contato</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Data</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Valor</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Status</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 italic">Carregando...</td></tr>
            ) : paginatedTransactions.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 italic">Nenhuma transação encontrada.</td></tr>
            ) : (
              paginatedTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onEdit={() => { setTransactionToEdit(tx); setIsEditModalOpen(true); }}
                  onDelete={() => { setTransactionToDelete(tx.id); setIsDeleteModalOpen(true); }}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredTransactions.length}</span> resultados
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-primary px-2">{currentPage} / {totalPages || 1}</span>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title="Excluir Transação" message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita." confirmLabel="Excluir" type="danger" />
      <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={fetchTransactions} transaction={transactionToEdit} />
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, iconColor, valueColor, trendColor }: any) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined ${iconColor} p-2 rounded-lg`}>{icon}</span>
    </div>
    <p className={`text-3xl font-bold whitespace-nowrap ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</p>
    <p className={`${trendColor || 'text-emerald-600'} text-xs font-bold flex items-center gap-1.5`}>
      <span className="material-symbols-outlined text-sm">trending_up</span> {trend}
    </p>
  </div>
);

const TransactionRow = ({ tx, onEdit, onDelete }: any) => {
  const navigate = useNavigate();
  return (
    <tr className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 pl-6 pr-3 text-center">
        <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl ${tx.accounts?.color || 'bg-primary'} flex items-center justify-center shrink-0 border border-white/20 shadow-sm relative overflow-hidden`}>
            {tx.accounts?.icon && tx.accounts.icon.startsWith('/') ? (
              <img src={tx.accounts.icon} alt={tx.accounts.name} className="size-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white text-[20px]">{tx.accounts?.icon || 'account_balance'}</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{tx.description}</span>
            <span className="text-xs text-slate-400">{tx.accounts?.name || '---'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {tx.categories?.name || 'S/ Categoria'}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          {tx.contacts?.name && <span className="material-symbols-outlined text-[16px]">person</span>}
          {tx.contacts?.name || '---'}
        </div>
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500 whitespace-nowrap">
        {formatDate(tx.date)}
      </td>
      <td className={`px-4 py-4 text-sm font-bold text-right whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {tx.type === 'income' ? '+' : '-'} {"R$\u00A0"}{Number(tx.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex justify-center">
          {tx.status === 'confirmed' ? (
            <span className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] font-bold">check</span>
            </span>
          ) : (
            <button onClick={() => navigate('/review')} className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Revisar
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
        </div>
      </td>
    </tr>
  );
};

export default Transactions;