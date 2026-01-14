import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';
import { toast } from 'react-hot-toast';
import { formatPhone } from '../utils/utils';

const Team: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    monitoring: 'todos'
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [stats, setStats] = useState({
    totalMembers: 0,
    monitored: 0,
    pending: 0
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
        .in('category', ['Funcionário', 'Grupo'])
        .order('name');

      if (contactsError) throw contactsError;

      setContacts(contactsData || []);

      const members = contactsData?.length || 0;
      const monitored = contactsData?.filter(c => c.whatsapp_monitoring).length || 0;

      // Buscar contatos monitorados para filtrar mensagens
      const monitoredContacts = (contactsData || []).filter(c => c.whatsapp_monitoring);

      // Criar lista de JIDs/phones para filtrar
      const monitoredJids: string[] = [];
      monitoredContacts.forEach(c => {
        // Para grupos: usar whatsapp_id (JID do grupo)
        if (c.is_group && c.whatsapp_id) {
          monitoredJids.push(c.whatsapp_id);
        }
        // Para contatos individuais: usar phone
        else if (!c.is_group && c.phone) {
          const phoneClean = c.phone.replace(/\D/g, '');
          monitoredJids.push(`${phoneClean}@s.whatsapp.net`);
          // Adicionar variações com/sem código do país
          if (phoneClean.startsWith('55')) {
            monitoredJids.push(`${phoneClean.substring(2)}@s.whatsapp.net`);
          } else {
            monitoredJids.push(`55${phoneClean}@s.whatsapp.net`);
          }
        }
      });

      // Buscar mensagens pendentes apenas dos contatos monitorados
      let pendingCount = 0;
      if (monitoredJids.length > 0) {
        const { data: pendingMsgs } = await supabase
          .from('whatsapp_messages')
          .select('remote_jid')
          .eq('status', 'pending');

        // Filtrar mensagens que são de contatos monitorados
        if (pendingMsgs) {
          pendingCount = pendingMsgs.filter(msg => {
            const msgJid = msg.remote_jid;
            return monitoredJids.some(jid => msgJid.includes(jid.split('@')[0]));
          }).length;
        }
      }

      setStats({
        totalMembers: members,
        monitored,
        pending: pendingCount
      });

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados da equipe.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const toggleMonitoring = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('contacts')
      .update({ whatsapp_monitoring: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar monitoramento.');
    } else {
      setContacts(prev => prev.map(c =>
        c.id === id ? { ...c, whatsapp_monitoring: !currentStatus } : c
      ));
      setStats(prev => ({
        ...prev,
        monitored: !currentStatus ? prev.monitored + 1 : prev.monitored - 1
      }));
      toast.success(`Monitoramento ${!currentStatus ? 'ativado' : 'desativado'}!`);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir membro.');
    } else {
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Membro excluído!');
      fetchContacts();
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  const filteredContacts = contacts.filter(c => {
    if (filters.monitoring !== 'todos') {
      const isActive = filters.monitoring === 'active';
      if (!!c.whatsapp_monitoring !== isActive) return false;
    }
    const cleanSearch = searchTerm.replace(/\D/g, '');
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cleanSearch && c.phone?.includes(cleanSearch)) ||
      c.phone?.includes(searchTerm)
    );
  });

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
      <PageHeader
        title="Equipe"
        description="Gerencie seus funcionários e permissões de monitoramento."
        actions={
          <div className="flex gap-3">
            <button
              onClick={fetchContacts}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button
              onClick={() => navigate('/team/new')}
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 md:px-6 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden md:inline">Novo Membro</span>
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Membros da Equipe"
          value={stats.totalMembers.toString()}
          trend="Total cadastrado"
          icon="badge"
          iconColor="text-primary bg-primary/10"
        />
        <StatCard
          label="Monitorados por IA"
          value={stats.monitored.toString()}
          trend="WhatsApp ativo"
          icon="smart_toy"
          iconColor="text-purple-500 bg-purple-500/10"
          valueColor="text-purple-600"
        />
        <StatCard
          label="Mensagens Pendentes"
          value={stats.pending.toString()}
          trend="Aguardando processamento"
          icon="pending_actions"
          iconColor="text-amber-500 bg-amber-500/10"
          valueColor="text-amber-600"
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
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <CustomSelect
              className="w-full sm:w-48"
              icon="smart_toy"
              value={filters.monitoring}
              onChange={(val) => setFilters({ ...filters, monitoring: val })}
              options={[
                { value: 'todos', label: 'Todos os Status' },
                { value: 'active', label: 'Monitoramento Ativo' },
                { value: 'inactive', label: 'Monitoramento Inativo' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-slate-850 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                <th className="py-4 pl-6 pr-3 w-12 text-center">
                  <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Membro</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Contato</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Monitoramento IA</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">Carregando equipe...</td></tr>
              ) : paginatedContacts.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">Nenhum membro encontrado.</td></tr>
              ) : (
                paginatedContacts.map(member => (
                  <TeamRow
                    key={member.id}
                    member={member}
                    onToggleMonitoring={() => toggleMonitoring(member.id, !!member.whatsapp_monitoring)}
                    onEdit={() => navigate(`/team/edit/${member.id}`)}
                    onDelete={() => setDeleteModal({ isOpen: true, id: member.id })}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="hidden sm:inline">Mostrando </span>
            <span className="font-bold text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredContacts.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredContacts.length}</span>
            <span className="hidden sm:inline"> resultados</span>
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
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => deleteModal.id && handleDelete(deleteModal.id)}
        title="Excluir Membro"
        message="Tem certeza que deseja remover este membro da equipe?"
        confirmLabel="Excluir"
        type="danger"
      />
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

// Team Row Component - Premium style
const TeamRow = ({ member, onToggleMonitoring, onEdit, onDelete }: any) => {
  return (
    <tr className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 pl-6 pr-3 text-center">
        <input className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-800 text-primary focus:ring-primary/50 size-4" type="checkbox" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.name} className="size-10 rounded-xl object-cover border border-white/20 shadow-sm" />
          ) : (
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${member.is_group ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
              <span className="material-symbols-outlined font-bold text-[22px]">{member.is_group ? 'groups' : 'person'}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{member.name}</span>
            <span className="text-xs text-slate-400">{member.is_group ? 'Grupo de WhatsApp' : (member.role || 'Funcionário')}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-slate-400">{member.is_group ? 'fingerprint' : 'phone'}</span>
            {member.is_group ? (member.whatsapp_id || 'ID não informado') : (formatPhone(member.phone) || '---')}
          </span>
          {!member.is_group && <span className="text-xs text-slate-400">{member.email || '---'}</span>}
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={member.whatsapp_monitoring}
              onChange={onToggleMonitoring}
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${member.whatsapp_monitoring ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
            {member.whatsapp_monitoring ? 'Ativo' : 'Inativo'}
          </span>
        </div>
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

export default Team;