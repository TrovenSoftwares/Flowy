import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/utils';
import { toast } from 'react-hot-toast';

const Sales: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalValue: 0,
    totalWeight: 0,
    totalShipping: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    period: 'Todo o período',
    seller: 'Todos'
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      // Busca separada para contornar ausência de FK no schema
      const [salesRes, contactsRes, accountsRes] = await Promise.all([
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('contacts').select('id, name, photo_url, phone'),
        supabase.from('accounts').select('id, name, color, icon')
      ]);

      if (salesRes.error) throw salesRes.error;

      // Mapear contacts e accounts por ID para lookup rápido
      const contactsMap = new Map((contactsRes.data || []).map(c => [c.id, c]));
      const accountsMap = new Map((accountsRes.data || []).map(a => [a.id, a]));

      // Mesclar dados client-side
      const enrichedSales = (salesRes.data || []).map(sale => ({
        ...sale,
        client: contactsMap.get(sale.client_id) || null,
        account: accountsMap.get(sale.account_id) || null
      }));

      setSales(enrichedSales);

      // Calculate stats
      const totalValue = enrichedSales.reduce((acc, s) => acc + Number(s.value || 0), 0);
      const totalWeight = enrichedSales.reduce((acc, s) => acc + Number(s.weight || 0), 0);
      const totalShipping = enrichedSales.reduce((acc, s) => acc + Number(s.shipping || 0), 0);
      setStats({
        totalSales: enrichedSales.length,
        totalValue,
        totalWeight,
        totalShipping
      });

    } catch (error: any) {
      console.error('Error fetching sales:', error);
      toast.error('Erro ao carregar vendas: ' + (error.message || 'Erro de conexão'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => fetchSales()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSales]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const clientName = sale.client?.name || '';
      const saleCode = sale.code || '';
      const saleValue = sale.value?.toString() || '';

      const matchesSearch =
        clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        saleCode.toLowerCase().includes(filters.search.toLowerCase()) ||
        saleValue.includes(filters.search);

      const matchesSeller = filters.seller === 'Todos' || sale.seller === filters.seller;

      let matchesPeriod = true;
      const saleDate = new Date(sale.date);
      const now = new Date();

      if (filters.period === 'Este Mês') {
        matchesPeriod = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      } else if (filters.period === 'Mês Passado') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        matchesPeriod = saleDate.getMonth() === lastMonth.getMonth() && saleDate.getFullYear() === lastMonth.getFullYear();
      } else if (filters.period === 'Últimos 7 dias') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesPeriod = saleDate >= sevenDaysAgo;
      }

      return matchesSearch && matchesSeller && matchesPeriod;
    });
  }, [sales, filters]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async () => {
    if (!saleToDelete) return;
    try {
      const { error } = await supabase.from('sales').delete().eq('id', saleToDelete);
      if (error) throw error;
      toast.success('Venda excluída com sucesso.');
      fetchSales();
    } catch (error) {
      toast.error('Erro ao excluir venda.');
    } finally {
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Histórico de Vendas"
        description="Gerencie todas as vendas realizadas e acompanhe os recebíveis."
        actions={
          <div className="flex gap-3">
            <button
              onClick={fetchSales}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button
              onClick={() => navigate('/sales/new')}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Nova Venda</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de Vendas"
          value={stats.totalSales.toString()}
          trend="Período selecionado"
          icon="receipt_long"
          iconColor="text-primary bg-primary/10"
        />
        <StatCard
          label="Faturamento"
          value={`R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Valor bruto"
          icon="payments"
          iconColor="text-emerald-500 bg-emerald-500/10"
          valueColor="text-emerald-600"
        />
        <StatCard
          label="Peso Total"
          value={`${stats.totalWeight.toLocaleString('pt-BR')}g`}
          secondaryValue={stats.totalWeight > 0 ? `R$ ${(stats.totalValue / stats.totalWeight).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g` : null}
          trend="Soma de produtos"
          icon="scale"
          iconColor="text-amber-500 bg-amber-500/10"
        />
        <StatCard
          label="Frete Arrecadado"
          value={`R$ ${stats.totalShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Total de frete"
          icon="local_shipping"
          iconColor="text-blue-500 bg-blue-500/10"
        />
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
              placeholder="Buscar por cliente, código ou valor..."
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
                { value: 'Últimos 7 dias', label: 'Últimos 7 dias' }
              ]}
            />
            <CustomSelect
              className="w-full sm:w-44"
              icon="person"
              value={filters.seller}
              onChange={(val) => setFilters({ ...filters, seller: val })}
              options={[
                { value: 'Todos', label: 'Todos Vendedores' },
                { value: 'WhatsApp IA', label: 'WhatsApp IA' },
                { value: 'Manual', label: 'Manual' }
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
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Cliente / Conta</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Data</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Valor Total</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Peso</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Frete</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Vendedor</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 italic">Carregando vendas...</td></tr>
            ) : paginatedSales.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 italic">Nenhuma venda encontrada.</td></tr>
            ) : (
              paginatedSales.map(sale => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  onEdit={() => navigate(`/sales/edit/${sale.id}`)}
                  onDelete={() => { setSaleToDelete(sale.id); setIsDeleteModalOpen(true); }}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSales.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredSales.length}</span> resultados
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Venda"
        message="Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        type="danger"
      />
    </div>
  );
};

// Stat Card Component - Premium style with optional secondary value
const StatCard = ({ label, value, secondaryValue, trend, icon, iconColor, valueColor, trendColor }: any) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 shadow-sm group hover:border-primary/30 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined ${iconColor} p-2 rounded-lg`}>{icon}</span>
    </div>
    <div className="flex flex-col">
      <p className={`text-2xl sm:text-3xl font-bold whitespace-nowrap ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</p>
      {secondaryValue && (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-px flex-1 bg-gradient-to-r from-amber-400/50 to-transparent"></div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
            ≈ {secondaryValue}
          </span>
        </div>
      )}
    </div>
    <p className={`${trendColor || 'text-slate-500'} text-xs font-medium flex items-center gap-1.5`}>
      <span className="material-symbols-outlined text-sm">info</span> {trend}
    </p>
  </div>
);

// Sale Row Component - with Edit button
const SaleRow = ({ sale, onEdit, onDelete }: any) => {
  return (
    <tr className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 pl-6 pr-3 text-center">
        <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl ${sale.account?.color || 'bg-primary'} flex items-center justify-center shrink-0 border border-white/20 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform`}>
            {sale.account?.icon && sale.account.icon.startsWith('/') ? (
              <img src={sale.account.icon} alt={sale.account.name} className="size-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white text-[20px]">{sale.account?.icon || 'store'}</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{sale.client?.name || 'Venda Avulsa'}</span>
            <span className="text-xs text-slate-400">{sale.code || sale.account?.name || '---'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500 whitespace-nowrap">
        {formatDate(sale.date)}
      </td>
      <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">
        {"R$\u00A0"}{Number(sale.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">
        {sale.weight ? `${Number(sale.weight).toLocaleString('pt-BR')}g` : '---'}
      </td>
      <td className="px-4 py-4 text-right text-xs font-bold text-slate-500">
        {sale.shipping > 0 ? (
          <>{"R$\u00A0"}{Number(sale.shipping).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
        ) : <span className="text-emerald-500">Grátis</span>}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {sale.seller || 'Manual'}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Sales;