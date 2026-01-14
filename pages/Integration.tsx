import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WhatsAppIcon } from '../components/BrandedIcons';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { evolutionApi } from '../lib/evolution';
import { toast } from 'react-hot-toast';
import { formatPhoneToJid } from '../utils/utils';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';
import Tooltip from '../components/Tooltip';

const Integration: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [integrations, setIntegrations] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    activeSources: 0,
    groups: 0,
    contacts: 0,
    isConnected: false
  });
  const [lastMessages, setLastMessages] = React.useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('Todos os Tipos');
  const [statusFilter, setStatusFilter] = React.useState('Status: Todos');
  const [instanceName, setInstanceName] = React.useState<string | null>(null);


  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch instance from instances table
      const { data: instanceData } = await supabase
        .from('instances')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let currentInstance = instanceData?.name;
      let isConnected = false;

      if (currentInstance) {
        try {
          const status = await evolutionApi.getInstanceStatus(currentInstance);
          isConnected = status === 'open';
        } catch (error) {
          console.warn('Instance found in settings but failed check:', error);
          // Optionally reset if invalid? For now, keep it to show status error.
        }
      }

      setInstanceName(currentInstance || 'Não configurado');

      // 2. Fetch monitored contacts from Supabase
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('whatsapp_monitoring', true)
        .order('name');

      if (error) throw error;

      setIntegrations(data || []);

      // Calculate stats - usando is_group para grupos
      const groupsCount = (data || []).filter(c => c.is_group === true).length;
      const contactsCount = (data || []).filter(c => c.is_group !== true).length;

      setStats({
        activeSources: data?.length || 0,
        groups: groupsCount,
        contacts: contactsCount,
        isConnected
      });

      // 3. Fetch last messages for each integration from database
      if (data) {
        const messagesMap: Record<string, any> = {};

        // Optimize: Fetch all latest messages in one go or batch if possible, but for now loop is safer for complex JID matching
        // We will try a broader search for each contact
        await Promise.all(data.map(async (contact) => {
          if (!contact.phone) return;

          try {
            // Clean phone: remove non-digits
            const phoneClean = contact.phone.replace(/\D/g, '');
            // Extract the core number (last 8 or 9 digits) to be safe against country code variations
            // Brazil phones: 55 + 2 digit area + 9 digit number. core is usually local number
            // We search for the phone number ending with the clean phone or containing it

            // Construct fuzzy search pattern
            // If phone has 55 (country code), try searching without it too
            const phoneNoCountry = phoneClean.startsWith('55') ? phoneClean.substring(2) : phoneClean;

            // Supabase doesn't support "endsWith" directly easily with OR, so we use ilike with wildcards
            const { data: msgs, error } = await supabase
              .from('whatsapp_messages')
              .select('*')
              .or(`remote_jid.ilike.%${phoneClean}%,remote_jid.ilike.%${phoneNoCountry}%`)
              .eq('instance_name', currentInstance) // Filter by instance
              .order('created_at', { ascending: false })
              .limit(1);

            if (!error && msgs && msgs.length > 0) {
              messagesMap[contact.id] = msgs[0];
            }
          } catch (e) {
            console.error('Error fetching msg for', contact.name, e);
          }
        }));

        setLastMessages(messagesMap);
      }

    } catch (error) {
      console.error('Failed to fetch integration data:', error);
      toast.error('Erro ao carregar dados de integração.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleMonitoring = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ whatsapp_monitoring: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setIntegrations(prev => prev.map(item =>
        item.id === id ? { ...item, whatsapp_monitoring: !currentStatus } : item
      ));

      if (currentStatus) {
        toast.success('Fonte pausada com sucesso.');
      } else {
        toast.success('Fonte reativada com sucesso.');
      }

      // Refresh stats
      fetchData();
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Erro ao atualizar status.');
    }
  };

  const confirmDeleteIntegration = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ whatsapp_monitoring: false })
        .eq('id', itemToDelete);

      if (error) throw error;

      setIntegrations(prev => prev.filter(item => item.id !== itemToDelete));
      toast.success('Integração removida.');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao remover integração.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const filteredIntegrations = integrations.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm));
    const matchesType = typeFilter === 'Todos os Tipos' ||
      (typeFilter === 'Grupos' && item.is_group === true) ||
      (typeFilter === 'Contatos' && item.is_group !== true);
    const matchesStatus = statusFilter === 'Status: Todos' ||
      (statusFilter === 'Ativos' && item.whatsapp_monitoring) ||
      (statusFilter === 'Pausados' && !item.whatsapp_monitoring);
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* Header Area */}
      <div className="w-full px-8 py-6 border-b border-[#e7edf3] dark:border-slate-800">
        <div className="max-w-[1200px] mx-auto">
          <PageHeader
            title="Gerenciamento de Integração WhatsApp"
            description="Gerencie quais contatos e grupos a IA monitora para leitura automatizada de despesas e notas fiscais."
            actions={
              <button
                onClick={() => navigate('/integration/config')}
                className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-primary/30 min-w-max active:scale-95"
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span>Configurar WhatsApp</span>
              </button>
            }
          />
        </div>
      </div>

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {loading ? (
          <div className="flex items-center justify-center p-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : !instanceName || instanceName === 'Não configurado' ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-center animate-in fade-in slide-in-from-bottom-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
            <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-6xl text-amber-500">lock</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Integração Bloqueada</h3>
            <p className="max-w-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-lg">
              Para gerenciar o monitoramento de contatos, você precisa primeiro conectar sua conta do WhatsApp na tela de ajustes.
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 text-lg"
            >
              <span className="material-symbols-outlined text-[24px]">settings</span>
              Ir para Configurações
            </button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatItem
                label="Fontes Ativas"
                value={stats.activeSources.toString()}
                icon="check_circle"
                iconColor="text-emerald-500 bg-emerald-500/10"
                trend="Total monitorado"
              />
              <StatItem
                label="Grupos"
                value={stats.groups.toString()}
                icon="groups"
                iconColor="text-blue-500 bg-blue-500/10"
                trend="Monit. coletivo"
              />
              <StatItem
                label="Contatos"
                value={stats.contacts.toString()}
                icon="person"
                iconColor="text-purple-500 bg-purple-500/10"
                trend="Monit. individual"
              />
              <div className="flex flex-col gap-1.5 sm:gap-2 rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-850 border border-[#e7edf3] dark:border-slate-800 shadow-sm group hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Status Conexão</p>
                  <span className={`material-symbols-outlined ${stats.isConnected ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'} p-1.5 sm:p-2 rounded-lg text-lg sm:text-xl shrink-0`}>cloud_sync</span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold tracking-tight ${stats.isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stats.isConnected ? 'Conectado' : 'Desconectado'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 mt-0.5 sm:mt-1">
                  <span className="material-symbols-outlined text-sm sm:text-base">{stats.isConnected ? 'sync' : 'sync_problem'}</span>
                  {stats.isConnected ? 'Sincronizado' : 'Conexão requerida'}
                </p>
              </div>
            </div>

            {/* Search & Filters Toolbar */}
            <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm mb-6 p-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-xl">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    className="block w-full rounded-lg border-transparent bg-[#f8fafc] dark:bg-slate-900 border focus:border-primary focus:ring-4 focus:ring-primary/10 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 dark:text-white transition-all"
                    placeholder="Buscar por nome ou telefone..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <CustomSelect
                    value={typeFilter}
                    onChange={(val) => setTypeFilter(val)}
                    icon="category"
                    options={[
                      { value: 'Todos os Tipos', label: 'Todos os Tipos' },
                      { value: 'Grupos', label: 'Grupos' },
                      { value: 'Contatos', label: 'Contatos' },
                    ]}
                  />
                  <CustomSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    icon="toggle_on"
                    options={[
                      { value: 'Status: Todos', label: 'Status: Todos' },
                      { value: 'Ativos', label: 'Ativos' },
                      { value: 'Pausados', label: 'Pausados' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {filteredIntegrations.length > 0 ? (
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-[#fcfdfd] dark:bg-slate-900/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-[#e7edf3] dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4" scope="col">Fonte</th>
                        <th className="px-6 py-4" scope="col">Tipo</th>
                        <th className="px-6 py-4" scope="col">Última Mensagem</th>
                        <th className="px-6 py-4" scope="col">
                          <div className="flex items-center gap-1">
                            Status IA
                            <Tooltip content="Indica se a IA está ativa para este contato" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center whitespace-nowrap" scope="col">
                          <div className="flex items-center justify-center gap-1">
                            Monitoramento
                            <Tooltip content="Ative ou pause a leitura de mensagens" position="left" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right whitespace-nowrap" scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredIntegrations.map(item => {
                        const lastMsg = lastMessages[item.id];
                        const msgContent = lastMsg?.content || lastMsg?.body || lastMsg?.message?.conversation || lastMsg?.message?.extendedTextMessage?.text || '';
                        const msgTime = lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';

                        return (
                          <IntegrationRow
                            key={item.id}
                            name={item.name}
                            subtitle={item.phone || (item.category === 'Grupo' ? 'Participantes...' : 'Sem telefone')}
                            type={item.category}
                            typeColor={item.category === 'Grupo' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"}
                            lastMessage={msgContent}
                            time={msgTime}
                            photoUrl={item.photo_url}
                            active={item.whatsapp_monitoring}
                            onToggle={() => handleToggleMonitoring(item.id, item.whatsapp_monitoring)}
                            onDelete={() => handleDeleteClick(item.id)}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
                    <span className="material-symbols-outlined text-4xl mb-2">inbox_customize</span>
                    <p>Nenhuma integração encontrada.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteIntegration}
        title="Remover Integração?"
        message="Tem certeza que deseja remover esta integração? A IA parará de monitorar este contato/grupo imediatamente."
        confirmLabel="Sim, Remover"
        type="danger"
      />
    </div >
  );
};

const StatItem = ({ label, value, trend, icon, iconColor, valueColor, trendColor }: any) => (
  <div className="flex flex-col gap-1.5 sm:gap-2 rounded-xl p-4 sm:p-6 bg-white dark:bg-slate-850 border border-[#e7edf3] dark:border-slate-800 shadow-sm group hover:border-primary/30 transition-all">
    <div className="flex items-center justify-between">
      <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{label}</p>
      <span className={`material-symbols-outlined ${iconColor} p-1.5 sm:p-2 rounded-lg text-lg sm:text-xl shrink-0`}>{icon}</span>
    </div>
    <p className={`text-xl sm:text-3xl font-bold tracking-tight ${valueColor || 'text-slate-900 dark:text-white'}`}>{value}</p>
    {trend && (
      <p className={`${trendColor || 'text-emerald-600'} text-[10px] sm:text-xs font-bold flex items-center gap-1.5 mt-0.5 sm:mt-1`}>
        <span className="material-symbols-outlined text-sm sm:text-base">info</span> {trend}
      </p>
    )}
  </div>
);

const IntegrationRow = ({ name, subtitle, type, typeColor, lastMessage, time, photoUrl, active, onToggle, onDelete }: any) => {
  const navigate = useNavigate();
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="size-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-primary shrink-0 font-bold">
              {name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 dark:text-white">{name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
          {type}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-slate-700 dark:text-slate-300 line-clamp-1 text-xs italic">
            {lastMessage ? `"${lastMessage}"` : "Nenhuma mensagem"}
          </span>
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${active ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
          {active ? 'Monitorando' : 'Inativo'}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="inline-flex items-center justify-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input checked={active} onChange={onToggle} className="sr-only peer" type="checkbox" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate('/integration/config')}
            className="text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Configurações"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Remover fonte"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Integration;
