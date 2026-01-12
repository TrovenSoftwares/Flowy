import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import FilterDrawer from '../components/FilterDrawer';
import CustomSelect from '../components/CustomSelect';
import { toast } from 'react-hot-toast';
import { formatPhone } from '../utils/utils';

const Contacts: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    financial: 'todos',
    minBalance: '',
    maxBalance: '',
    personType: 'todos',
    sortField: 'name',
    sortOrder: 'asc'
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSales: 0,
    totalReceived: 0,
    totalReceivable: 0
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('name');
      if (contactsError) throw contactsError;

      const [salesResult, transResult] = await Promise.all([
        supabase
          .from('sales')
          .select('client_id, value, shipping')
          .not('client_id', 'is', null),
        supabase
          .from('transactions')
          .select('contact_id, value, type, status')
          .eq('type', 'income')
          .eq('status', 'confirmed')
          .not('contact_id', 'is', null)
      ]);

      if (salesResult.error || transResult.error) {
        console.error('Fetch error:', salesResult.error || transResult.error);
        throw salesResult.error || transResult.error;
      }

      const salesData = salesResult.data || [];
      const transData = transResult.data || [];

      // Calculate per-client balances
      const salesByClient: Record<string, number> = {};
      const receivedByClient: Record<string, number> = {};

      // 1. Sum sales per client (Value + Shipping)
      salesData.forEach((s: any) => {
        if (!salesByClient[s.client_id]) salesByClient[s.client_id] = 0;
        salesByClient[s.client_id] += (Number(s.value) + Number(s.shipping || 0));
      });

      // 2. Sum received payments per client (Income transactions)
      transData.forEach((t: any) => {
        if (!receivedByClient[t.contact_id]) receivedByClient[t.contact_id] = 0;
        receivedByClient[t.contact_id] += Number(t.value);
      });

      // Calculate balance: Sales - Received
      const mergedContacts = (contactsData || []).map(c => {
        const totalSalesValue = salesByClient[c.id] || 0;
        const totalReceivedValue = receivedByClient[c.id] || 0;
        return {
          ...c,
          totalSales: totalSalesValue,
          totalReceived: totalReceivedValue,
          balance: totalSalesValue - totalReceivedValue
        };
      });

      setContacts(mergedContacts);

      // Calculate global stats
      const clientContacts = mergedContacts.filter(c => c.category === 'Cliente');
      const totalSalesSum = clientContacts.reduce((acc, c) => acc + c.totalSales, 0);
      const totalReceivedSum = clientContacts.reduce((acc, c) => acc + c.totalReceived, 0);
      const totalReceivableSum = clientContacts.reduce((acc, c) => acc + c.balance, 0);

      setStats({
        totalClients: clientContacts.length,
        totalSales: totalSalesSum,
        totalReceived: totalReceivedSum,
        totalReceivable: totalReceivableSum
      });

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir contato: ' + error.message);
    } else {
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contato excluído com sucesso!');
      fetchContacts(); // Refresh stats
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const filteredContacts = contacts.filter(c => {
    if (c.category !== 'Cliente') return false;
    if (filters.financial !== 'todos') {
      if (filters.financial === 'receivable' && c.balance <= 0) return false;
      if (filters.financial === 'payable' && c.balance >= 0) return false;
      if (filters.financial === 'zero' && c.balance !== 0) return false;
    }
    if (filters.minBalance && c.balance < parseFloat(filters.minBalance)) return false;
    if (filters.maxBalance && c.balance > parseFloat(filters.maxBalance)) return false;
    if (filters.personType !== 'todos') {
      const idStr = c.id_number ? c.id_number.replace(/\D/g, '') : '';
      if (filters.personType === 'fisica' && idStr.length !== 11) return false;
      if (filters.personType === 'juridica' && idStr.length !== 14) return false;
    }
    const cleanSearch = searchTerm.replace(/\D/g, '');
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id_number?.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cleanSearch && c.phone?.includes(cleanSearch)) ||
      c.phone?.includes(searchTerm)
    );
  }).sort((a, b) => {
    const order = filters.sortOrder === 'asc' ? 1 : -1;
    if (filters.sortField === 'name') return a.name.localeCompare(b.name) * order;
    if (filters.sortField === 'balance') return (a.balance - b.balance) * order;
    if (filters.sortField === 'created_at') return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order;
    return 0;
  });

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Gerenciamento de Contatos"
        description="Administre fornecedores e clientes, visualize históricos e integre com o WhatsApp."
        actions={
          <div className="flex gap-3">
            <button
              onClick={fetchContacts}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button
              onClick={() => navigate('/contacts/new')}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Novo Contato</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Clientes Ativos"
          value={stats.totalClients.toString()}
          trend="Total na base"
          icon="groups"
          iconColor="text-primary bg-primary/10"
        />
        <StatCard
          label="Total em Vendas"
          value={`R$ ${stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Valor bruto vendido"
          icon="point_of_sale"
          iconColor="text-blue-500 bg-blue-500/10"
        />
        <StatCard
          label="Total Recebido"
          value={`R$ ${stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Pagamentos confirmados"
          icon="payments"
          iconColor="text-emerald-500 bg-emerald-500/10"
          valueColor="text-emerald-600"
        />
        <StatCard
          label="Saldo Geral"
          value={`R$ ${stats.totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="Vendas - Recebimentos"
          icon="account_balance_wallet"
          iconColor="text-amber-500 bg-amber-500/10"
          valueColor={stats.totalReceivable >= 0 ? "text-amber-600" : "text-emerald-600"}
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
              placeholder="Buscar por nome, CPF/CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => { setTempFilters(filters); setIsFilterOpen(true); }}
              className={`flex items-center justify-center gap-2 h-10 px-4 rounded-lg border text-sm font-bold transition-all ${filters.financial !== 'todos' || filters.minBalance || filters.maxBalance || filters.personType !== 'todos' ? 'bg-primary/5 border-primary text-primary' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary'}`}
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span>Filtros {(filters.financial !== 'todos' || filters.minBalance || filters.maxBalance || filters.personType !== 'todos') ? '(Ativos)' : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <th className="py-4 pl-6 pr-3 w-12 text-center">
                <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
              </th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Cliente</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Contato</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Total Vendas</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Total Recebido</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Saldo</th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 italic">Carregando contatos...</td></tr>
            ) : paginatedContacts.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 italic">Nenhum contato encontrado.</td></tr>
            ) : (
              paginatedContacts.map(contact => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onEdit={() => navigate(`/contacts/edit/${contact.id}`)}
                  onDelete={() => setDeleteModal({ isOpen: true, id: contact.id })}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredContacts.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredContacts.length}</span> resultados
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

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => { setFilters(tempFilters); setIsFilterOpen(false); toast.success('Filtros aplicados!'); }}
        onClear={() => { const defaults = { financial: 'todos', minBalance: '', maxBalance: '', personType: 'todos', sortField: 'name', sortOrder: 'asc', search: '' }; setTempFilters(defaults); setFilters(defaults); setIsFilterOpen(false); toast.success('Filtros limpos!'); }}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Situação Financeira</label>
            <CustomSelect value={tempFilters.financial} onChange={(val) => setTempFilters({ ...tempFilters, financial: val })} options={[{ value: 'todos', label: 'Todas as Situações' }, { value: 'receivable', label: 'Saldo Devedor (A Receber)' }, { value: 'payable', label: 'Saldo Credor (A Pagar)' }, { value: 'zero', label: 'Saldo Zerado' }]} icon="account_balance_wallet" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Faixa de Saldo (R$)</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Mínimo" className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-primary" value={tempFilters.minBalance} onChange={(e) => setTempFilters({ ...tempFilters, minBalance: e.target.value })} />
              <input type="number" placeholder="Máximo" className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-primary" value={tempFilters.maxBalance} onChange={(e) => setTempFilters({ ...tempFilters, maxBalance: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tipo de Pessoa</label>
            <CustomSelect value={tempFilters.personType} onChange={(val) => setTempFilters({ ...tempFilters, personType: val })} options={[{ value: 'todos', label: 'Todos os Tipos' }, { value: 'fisica', label: 'Pessoa Física (CPF)' }, { value: 'juridica', label: 'Pessoa Jurídica (CNPJ)' }]} icon="badge" />
          </div>
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">sort</span>Ordenação</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Ordenar por</label>
                <CustomSelect value={tempFilters.sortField} onChange={(val) => setTempFilters({ ...tempFilters, sortField: val })} options={[{ value: 'name', label: 'Nome' }, { value: 'balance', label: 'Saldo' }, { value: 'created_at', label: 'Data de Cadastro' }]} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Ordem</label>
                <div className="flex gap-2">
                  {[{ value: 'asc', label: 'Crescente', icon: 'arrow_upward' }, { value: 'desc', label: 'Decrescente', icon: 'arrow_downward' }].map(opt => (
                    <button key={opt.value} onClick={() => setTempFilters({ ...tempFilters, sortOrder: opt.value })} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-bold transition-all ${tempFilters.sortOrder === opt.value ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-600'}`}><span className="material-symbols-outlined text-[18px]">{opt.icon}</span>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FilterDrawer>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => deleteModal.id && handleDelete(deleteModal.id)}
        title="Excluir Contato"
        message="Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        type="danger"
      />
    </div>
  );
};

// Stat Card Component - Premium style matching Sales/Transactions
const StatCard = ({ label, value, trend, icon, iconColor, valueColor, trendColor }: any) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 shadow-sm group hover:border-primary/30 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined ${iconColor} p-2 rounded-lg`}>{icon}</span>
    </div>
    <p className={`text-2xl sm:text-3xl font-bold ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</p>
    <p className={`${trendColor || 'text-slate-500'} text-xs font-medium flex items-center gap-1.5`}>
      <span className="material-symbols-outlined text-sm">info</span> {trend}
    </p>
  </div>
);

// Contact Row Component - Premium style matching Sales/Transactions
const ContactRow = ({ contact, onEdit, onDelete }: any) => {
  return (
    <tr className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 pl-6 pr-3 text-center">
        <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {contact.photo_url ? (
            <img src={contact.photo_url} alt={contact.name} className="size-10 rounded-xl object-cover border border-white/20 shadow-sm" />
          ) : (
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-primary font-bold text-sm">{contact.name.substring(0, 2).toUpperCase()}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{contact.name}</span>
            <span className="text-xs text-slate-400">{contact.id_number || '---'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-slate-400">phone</span>
            {formatPhone(contact.phone) || '---'}
          </span>
          <span className="text-xs text-slate-400">{contact.email || '---'}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-right text-sm font-bold text-blue-600">
        R$ {contact.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-4 text-right text-sm font-bold text-emerald-600">
        R$ {contact.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-4 text-right">
        <span className={`text-sm font-bold ${contact.balance > 0 ? 'text-amber-600' : contact.balance < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
          R$ {contact.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

export default Contacts;