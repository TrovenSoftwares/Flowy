import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WhatsAppIcon } from '../components/BrandedIcons';
import PageHeader from '../components/PageHeader';
import { evolutionApi } from '../lib/evolution';
import { toast } from 'react-hot-toast';
import CustomSelect from '../components/CustomSelect';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';
import { formatPhoneToJid } from '../utils/utils';
import Tooltip from '../components/Tooltip';

const IntegrationConfig: React.FC = () => {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = React.useState<string>('Initializing debug...');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'open' | 'connecting' | 'closed'>('closed');
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [historyPeriod, setHistoryPeriod] = React.useState('Últimos 30 dias');
  const [instanceName, setInstanceName] = React.useState<string | null>(null);
  const [monitoredContacts, setMonitoredContacts] = React.useState<any[]>([]);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = React.useState(false);
  const [contactMessages, setContactMessages] = React.useState<Record<string, any[]>>({});
  const [selectedContact, setSelectedContact] = React.useState<any | null>(null);
  const [isMessagesTrayOpen, setIsMessagesTrayOpen] = React.useState(false);
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [isWebhookActive, setIsWebhookActive] = React.useState(false);
  const [webhookLoading, setWebhookLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // New Instance Management States
  const [isInstanceModalOpen, setIsInstanceModalOpen] = React.useState(false);
  const [newInstanceName, setNewInstanceName] = React.useState('');
  const [isEditingInstance, setIsEditingInstance] = React.useState(false);

  // AI Config State
  const [aiConfig, setAiConfig] = React.useState({
    readInvoices: true,
    readPix: true,
    readAudio: false,
  });
  // const [showGroqKey, setShowGroqKey] = React.useState(false); // REMOVED

  const checkStatus = React.useCallback(async () => {
    if (!instanceName) return;
    try {
      const currentState = await evolutionApi.getInstanceStatus(instanceName);
      setStatus(currentState);

      // Sync status to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('instances')
          .update({ status: currentState, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('name', instanceName);
      }

      if (currentState === 'open') {
        setQrCode(null);
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  }, [instanceName]);

  const fetchSettings = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('ai_config')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: instanceData } = await supabase
        .from('instances')
        .select('name')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .order('updated_at', { ascending: false });

      console.log('DEBUG: User ID:', user.id);
      console.log('DEBUG: RAW Instance Data Array:', instanceData);

      setDebugInfo(`User: ${user.id.substring(0, 5)} | Instances Found: ${instanceData ? instanceData.length : 'null'} | First: ${instanceData && instanceData[0] ? instanceData[0].name : 'none'}`);

      if (error) throw error;

      if (data?.ai_config) {
        const { historyPeriod: savedHistory, webhookUrl: savedWebhook, whatsappInstance, ...restConfig } = data.ai_config;

        setAiConfig(prev => ({ ...prev, ...restConfig }));
        if (savedHistory) setHistoryPeriod(savedHistory);
        if (savedWebhook) setWebhookUrl(savedWebhook);

        const activeInstance = (instanceData && instanceData[0]?.name) || whatsappInstance;
        if (activeInstance) {
          setInstanceName(activeInstance);
          return activeInstance;
        }
      } else if (instanceData && instanceData[0]?.name) {
        setInstanceName(instanceData[0].name);
        return instanceData[0].name;
      }
      return null;
    } catch (error: any) {
      console.error('Failed to fetch user settings:', error);
      setDebugInfo(`Error: ${error.message}`);
      return null;
    }
  }, []);

  const discoverInstance = React.useCallback(async () => {
    setLoading(true);
    try {
      const savedInstance = await fetchSettings();
      if (savedInstance) {
        setInstanceName(savedInstance);
      } else {
        setInstanceName(null);
      }
    } catch (error) {
      console.error('Failed to discover instances:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSettings]);

  React.useEffect(() => {
    discoverInstance();
  }, [discoverInstance]);

  const fetchMonitoredContacts = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('whatsapp_monitoring', true)
        .order('name');

      if (error) throw error;
      setMonitoredContacts(data || []);
    } catch (error) {
      console.error('Failed to fetch monitored contacts:', error);
    }
  }, []);

  const fetchContactMessages = React.useCallback(async (contact: any, manual = false) => {
    if (!contact.phone) return;

    // Only set refreshing if triggered manually to avoid UI flicker on auto-load
    if (manual) setIsRefreshing(true);

    try {
      // Fetch messages from Supabase whatsapp_messages table
      const phoneClean = contact.phone.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .or(`remote_jid.ilike.%${phoneClean}%,remote_jid.ilike.%${phoneClean.slice(-9)}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        setContactMessages(prev => ({
          ...prev,
          [contact.id]: data
        }));
        if (manual) toast.success('Histórico atualizado!');
      } else {
        if (manual) toast('Nenhuma mensagem encontrada.', { icon: '📭' });
      }
    } catch (error) {
      console.error(`Failed to fetch messages for ${contact.name}:`, error);
      if (manual) toast.error('Falha ao buscar mensagens.');
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    if (monitoredContacts.length > 0) {
      monitoredContacts.forEach(contact => {
        fetchContactMessages(contact);
      });
    }
  }, [monitoredContacts, fetchContactMessages]);

  React.useEffect(() => {
    fetchMonitoredContacts();
  }, [fetchMonitoredContacts]);

  React.useEffect(() => {
    if (instanceName) {
      checkStatus();
      const interval = setInterval(checkStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [checkStatus, instanceName]);

  const handleSaveInstanceName = async () => {
    if (!newInstanceName) {
      toast.error('O nome da instância é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const instanceToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // 1. Create instance in Evolution API
      // Pass the generated token
      await evolutionApi.createInstance(newInstanceName, instanceToken);

      // 2. Save to Supabase Instances Table
      const { error: dbError } = await supabase.from('instances').upsert({
        user_id: user.id,
        name: newInstanceName,
        token: instanceToken,
        status: 'connecting',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,name' });

      if (dbError) throw dbError;

      // 3. Update user_settings (legacy/sync)
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ai_config: { ...aiConfig, whatsappInstance: newInstanceName },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setInstanceName(newInstanceName);
      setIsInstanceModalOpen(false);
      setNewInstanceName('');
      toast.success('Instância configurada! Pronto para conectar.');

      // Trigger QR Code generation automatically
      const connectData = await evolutionApi.connectInstance(newInstanceName);
      if (connectData.base64 || connectData.code) {
        setQrCode(connectData.base64 || connectData.code);
        setStatus('connecting');
      }
    } catch (error: any) {
      console.error('Failed to save instance:', error);
      toast.error('Erro ao configurar instância. Tente um nome diferente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!instanceName) {
      setIsInstanceModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const data = await evolutionApi.connectInstance(instanceName);
      if (data.code || data.base64) {
        setQrCode(data.base64 || data.code);
        setStatus('connecting');

        // Sync status 'connecting' to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('instances')
            .update({ status: 'connecting', updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('name', instanceName);
        }
      } else if (data.message && data.message.includes('not found')) {
        // If not found, we recreate. Note: user might be different if token logic was strict, but here we assume same user flow.
        // We might need to handle token if we recreate? 
        // For now, simple create. Ideally we re-fetch token from DB or generate new one and update DB.

        // Let's generate a new token since we are recreating
        const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await evolutionApi.createInstance(instanceName, newToken);

        const connectData = await evolutionApi.connectInstance(instanceName);
        setQrCode(connectData.base64 || connectData.code);
        setStatus('connecting');

        // Update DB with new token and status
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('instances')
            .upsert({
              user_id: user.id,
              name: instanceName,
              token: newToken,
              status: 'connecting',
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,name' });
        }
      }
      toast.success('QR Code gerado!');
    } catch (error) {
      console.error('Failed to generate QR:', error);
      toast.error('Erro ao gerar QR Code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!instanceName) return;
    setLoading(true);
    try {
      await evolutionApi.logoutInstance(instanceName);
      setStatus('closed');
      setQrCode(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('instances')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('name', instanceName);
      }

      toast.success('Desconectado com sucesso.');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao desconectar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!instanceName) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // 1. Remove from instances table
      toast.loading('Apagando do banco de dados...', { id: 'delete-toast' });
      const { error: dbError, count } = await supabase.from('instances').delete().eq('name', instanceName).eq('user_id', user.id).select();

      console.log('DB Delete count:', count);

      if (dbError) throw dbError;

      // 2. Remove from settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ai_config: { ...aiConfig, whatsappInstance: null },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // 3. Delete from Evolution API
      try {
        toast.loading('Apagando da Evolution API...', { id: 'delete-toast' });
        await evolutionApi.deleteInstance(instanceName);
      } catch (e: any) {
        console.warn('Failed to delete from Evolution (might already be deleted)', e);
        toast.error(`Falha na API: ${e.message}`, { id: 'delete-toast' });
        // We don't re-throw here to allow UI to clear if DB is cleared. 
      }

      setInstanceName(null);
      setStatus('closed');
      setQrCode(null);
      toast.success('Instância e dados removidos com sucesso.', { id: 'delete-toast' });
    } catch (error: any) {
      console.error('Delete instance error:', error);
      toast.error(`Erro ao remover: ${error.message}`);
    } finally {
      setLoading(false);
      setIsDisconnectModalOpen(false);
    }
  };

  const handleSaveSettings = async (newConfig?: any, newHistoryPeriod?: string, newWebhookUrl?: string) => {
    const configToSave = newConfig || aiConfig;
    const historyToSave = newHistoryPeriod || historyPeriod;
    const webhookToSave = newWebhookUrl !== undefined ? newWebhookUrl : webhookUrl;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado.');
        return;
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ai_config: { ...configToSave, historyPeriod: historyToSave, webhookUrl: webhookToSave },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Update local state only after successful save
      if (newConfig) setAiConfig(newConfig);
      if (newHistoryPeriod) setHistoryPeriod(newHistoryPeriod);
      // Logic for webhookUrl state update is usually handled by input onChange, but we can sync here if needed

      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Erro ao salvar as configurações.');
    }
  };

  const handleToggleAiConfig = async (key: keyof typeof aiConfig) => {
    const newConfig = { ...aiConfig, [key]: !aiConfig[key] };

    // Sync with Evolution API if it's the main reading toggle
    if (key === 'readMessages' && instanceName) {
      try {
        await evolutionApi.updateSettings(instanceName, { readMessages: newConfig.readMessages });
      } catch (e) {
        console.error('Failed to sync with Evo API', e);
        // Don't block DB save
      }
    }

    await handleSaveSettings(newConfig);
  };

  const handleHistoryChange = async (val: string) => {
    await handleSaveSettings(undefined, val);
  };

  const checkWebhookStatus = React.useCallback(async () => {
    if (!instanceName || status !== 'open') return;
    try {
      const data = await evolutionApi.findWebhooks(instanceName);
      if (Array.isArray(data) && data.length > 0) {
        const active = data.some((w: any) => w.enabled && w.url.includes('financeiro-ai'));
        setIsWebhookActive(active);
        // Only update URL from API if local state is empty, to favor user edits
        if (active && (!webhookUrl || webhookUrl === '')) {
          const w = data.find((w: any) => w.url.includes('financeiro-ai'));
          if (w?.url) setWebhookUrl(w.url);
        }
      }
    } catch (error) {
      console.error('Failed to check webhook status:', error);
    }
  }, [instanceName, status]); // Removed webhookUrl from dependency to avoid loop/flicker

  React.useEffect(() => {
    checkWebhookStatus();
  }, [checkWebhookStatus]);

  const handleRegisterWebhook = async () => {
    const finalWebhookUrl = 'https://webhook.site/versix-ai-standard-placeholder'; // URL Padrão
    setWebhookLoading(true);
    try {
      await evolutionApi.setWebhook(instanceName, {
        url: finalWebhookUrl,
        enabled: true,
        webhook_by_events: false,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE"
        ]
      });
      setIsWebhookActive(true);
      await handleSaveSettings(undefined, undefined, finalWebhookUrl); // Save to DB
      toast.success('Webhook padrão registrado!');
    } catch (error) {
      console.error('Failed to register webhook:', error);
      toast.error('Erro ao registrar Webhook.');
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header Area */}
      <div className="w-full py-4 border-b border-[#e7edf3] dark:border-slate-800">
        <PageHeader
          title="Configuração de Integração WhatsApp"
          description="Conecte sua conta para permitir que a IA leia faturas, boletos e comprovantes diretamente das suas conversas financeiras."
          actions={
            <button
              onClick={() => navigate('/integration')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Voltar</span>
            </button>
          }
        />
      </div>

      <div className="space-y-8 pt-8 w-full">



        {!instanceName ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-center animate-in fade-in slide-in-from-bottom-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
            <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-6xl text-amber-500">lock</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Configuração Bloqueada</h3>
            <p className="max-w-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-lg">
              Para gerenciar a integração e a inteligência artificial, você precisa primeiro conectar sua conta do WhatsApp na tela de ajustes.
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Connection & Rules */}
            <div className="lg:col-span-7 flex flex-col gap-6">



              {/* Connection Status Card */}
              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <WhatsAppIcon className="size-5" />
                    Status da Conexão
                  </h2>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : status === 'connecting' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${status === 'open' ? 'bg-green-500' : status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {status === 'open' ? 'Conectado' : status === 'connecting' ? 'Aguardando Leitura' : 'Desconectado'}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-50 dark:bg-[#131b24] rounded-lg p-5 border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {instanceName || 'WhatsApp (Não Configurado)'}
                        </h3>
                        {instanceName && (
                          <button
                            onClick={() => {
                              setNewInstanceName(instanceName);
                              setIsInstanceModalOpen(true);
                              setIsEditingInstance(true);
                            }}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors"
                            title="Editar Nome da Instância"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {!instanceName
                          ? 'Comece dando um nome para sua integração para gerar o seu QR Code.'
                          : status === 'open'
                            ? 'Sua conta está vinculada e pronta para processar mensagens.'
                            : 'Escaneie o QR Code ao lado com seu aplicativo do WhatsApp para vincular a conta.'}
                      </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                      {status === 'open' ? (
                        <button
                          onClick={() => setIsDisconnectModalOpen(true)}
                          disabled={loading}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">logout</span>
                          Desconectar
                        </button>
                      ) : (
                        <button
                          onClick={handleGenerateQR}
                          disabled={loading}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">{loading ? 'sync' : 'qr_code_2'}</span>
                          {loading ? 'Gerando...' : 'Gerar Novo Código'}
                        </button>
                      )}
                      <button
                        onClick={checkStatus}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Atualizar Status
                      </button>
                    </div>
                  </div>
                  {/* QR Code Display */}
                  <div className="w-40 h-40 shrink-0 bg-white p-2 rounded-lg shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {qrCode ? (
                      <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" className="w-full h-full" />
                    ) : status === 'open' ? (
                      <div className="flex flex-col items-center text-green-500">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                        <span className="text-[10px] font-bold mt-1">CONECTADO</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-300 text-center p-4">
                        <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                        <span className="text-[10px] mt-2">Clique em gerar código</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Configuration Card */}
              <div className="bg-white dark:bg-[#1a2632] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configuração da IA</h2>
                        <Tooltip content="A IA lerá as mensagens para identificar transações automaticamente." />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">O que a inteligência artificial deve buscar?</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={aiConfig.readMessages}
                      onChange={() => handleToggleAiConfig('readMessages')}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                    <span className="ml-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {aiConfig.readMessages ? 'Ativa' : 'Pausada'}
                    </span>
                  </label>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Tipos de Documentos</p>
                    <CheckboxItem
                      title="Faturas e Boletos (PDF/Imagem)"
                      description="Extrai código de barras, data de vencimento e valor."
                      checked={aiConfig.readInvoices}
                      onChange={() => handleToggleAiConfig('readInvoices')}
                    />
                    <CheckboxItem
                      title="Comprovantes de Pix"
                      description="Identifica pagamentos realizados e recebidos."
                      checked={aiConfig.readPix}
                      onChange={() => handleToggleAiConfig('readPix')}
                    />
                    <CheckboxItem
                      title="Transcrição de Áudio"
                      description="Transcreve áudios buscando por aprovações financeiras."
                      checked={aiConfig.readAudio}
                      onChange={() => handleToggleAiConfig('readAudio')}
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Configuração de IA</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            As chaves de API e modelos de inteligência (Groq, OpenAI, Claude, Gemini) agora são gerenciados de forma
                            <span className="font-bold text-primary ml-1">Padronizada</span> para garantir o melhor processamento das suas mensagens.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Histórico de Processamento
                    </label>
                    <CustomSelect
                      value={historyPeriod}
                      onChange={handleHistoryChange}
                      options={[
                        { value: 'Ler apenas novas mensagens', label: 'Ler apenas novas mensagens' },
                        { value: 'Últimos 7 dias', label: 'Últimos 7 dias' },
                        { value: 'Últimos 30 dias', label: 'Últimos 30 dias' },
                        { value: 'Todo o histórico disponível', label: 'Todo o histórico disponível' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Security Privacy Card */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 flex gap-4 items-start">
                <span className="material-symbols-outlined text-primary text-2xl shrink-0">security</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Privacidade e Segurança</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Apenas as conversas marcadas explicitamente como "Monitoradas" serão processadas pela IA. Seus dados são criptografados de ponta a ponta e usados apenas para extração de dados financeiros.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Chat Sources */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[700px] lg:h-full overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fontes de Dados</h2>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            // 1. Fetch distinct JIDs from logs
                            const { data: logs, error: logsError } = await supabase.from('whatsapp_messages').select('remote_jid, created_at').order('created_at', { ascending: false });

                            if (logsError) {
                              console.error('Error fetching logs:', logsError);
                              toast.error('Erro ao buscar logs de mensagens.');
                              return;
                            }

                            if (!logs || logs.length === 0) {
                              toast('Nenhuma mensagem encontrada nos logs.', { icon: '📭' });
                              return;
                            }

                            // 2. Filter unique JIDs
                            const uniqueJids = new Set(logs?.map(l => l.remote_jid).filter(jid => jid?.includes('@s.whatsapp.net')));

                            if (uniqueJids.size === 0) {
                              toast('Nenhum JID de WhatsApp encontrado nos logs.', { icon: '📭' });
                              return;
                            }

                            // 3. Fetch existing contacts
                            const { data: contacts, error: contactsError } = await supabase.from('contacts').select('phone');
                            if (contactsError) {
                              console.error('Error fetching contacts:', contactsError);
                              toast.error('Erro ao buscar contatos existentes.');
                              return;
                            }

                            const existingPhones = new Set(contacts?.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean));

                            // 4. Find new ones
                            let newCount = 0;
                            const { data: { user } } = await supabase.auth.getUser();

                            for (const jid of uniqueJids) {
                              const fullPhone = jid.split('@')[0];
                              const phone = fullPhone.replace(/^55/, ''); // Remove Brazil code

                              // Check if we already have this phone (partial match to cover 9 digit variations)
                              const exists = Array.from(existingPhones).some(p =>
                                p && (p.includes(phone.slice(-9)) || phone.includes(p.slice(-9)))
                              );

                              if (!exists) {
                                const { error: insertError } = await supabase.from('contacts').insert({
                                  user_id: user?.id,
                                  name: `Novo Contato (${phone})`,
                                  phone: fullPhone,
                                  category: 'Cliente',
                                  whatsapp_monitoring: true,
                                  ia_status: 'Inativo',
                                  balance: 0
                                });

                                if (insertError) {
                                  console.error('Error inserting contact:', insertError);
                                } else {
                                  newCount++;
                                }
                              }
                            }

                            if (newCount > 0) {
                              toast.success(`${newCount} novos contatos descobertos!`);
                              fetchMonitoredContacts(); // Refresh list
                            } else {
                              toast('Nenhum contato novo encontrado nos logs.', { icon: '🔍' });
                            }
                          } catch (err) {
                            console.error('Discovery error:', err);
                            toast.error('Erro na descoberta de contatos.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Sincronizar e Descobrir Contatos"
                      >
                        <span className="material-symbols-outlined text-[20px]">{loading ? 'sync' : 'person_add'}</span>
                      </button>
                      <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md h-fit">
                        {monitoredContacts.length} Ativos
                      </span>
                    </div>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
                      placeholder="Buscar contatos monitorados..."
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {monitoredContacts.filter(c =>
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.phone.includes(searchTerm)
                  ).length > 0 ? (
                    monitoredContacts
                      .filter(c =>
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.phone.includes(searchTerm)
                      )
                      .map(contact => (
                        <ChatSourceItem
                          key={contact.id}
                          name={contact.name}
                          type={contact.category}
                          initials={contact.name.substring(0, 2).toUpperCase()}
                          active={true}
                          imageUrl={contact.photo_url}
                          onViewMessages={() => {
                            setSelectedContact(contact);
                            setIsMessagesTrayOpen(true);
                          }}
                          onToggle={async () => {
                            const { error } = await supabase
                              .from('contacts')
                              .update({ whatsapp_monitoring: false })
                              .eq('id', contact.id);
                            if (!error) {
                              setMonitoredContacts(prev => prev.filter(c => c.id !== contact.id));
                              toast.success('Monitoramento removido.');
                            }
                          }}
                        />
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                      <span className="material-symbols-outlined text-4xl mb-2">contact_support</span>
                      <p className="text-sm">Nenhum contato sendo monitorado no momento.</p>
                      <Link to="/contacts" className="text-primary text-xs font-bold mt-2 hover:underline">Ir para Contatos</Link>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    Mostrando {monitoredContacts.length} contatos monitorados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleDeleteInstance}
        title="Remover Instância?"
        message="Isso desconectará seu WhatsApp e removerá a configuração desta instância do sistema. Deseja continuar?"
        confirmLabel="Sim, Remover"
        type="danger"
      />

      {/* Instance Name Modal */}
      {isInstanceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">qr_code_2</span>
                {isEditingInstance ? 'Editar Nome da Instância' : 'Nomear sua Instância'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Escolha um nome simples para identificar seu WhatsApp (ex: 'empresa-vendas').
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome da Instância</label>
                <input
                  type="text"
                  autoFocus
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="ex: minha-loja"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                />
                <p className="text-[10px] text-slate-400 ml-1 italic">Apenas letras minúsculas, números e traços são permitidos.</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
              <button
                onClick={() => {
                  setIsInstanceModalOpen(false);
                  setNewInstanceName('');
                  setIsEditingInstance(false);
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInstanceName}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || !newInstanceName}
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>}
                {isEditingInstance ? 'Salvar' : 'Configurar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages History Tray */}
      {isMessagesTrayOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedContact.photo_url ? (
                  <img src={selectedContact.photo_url} className="size-10 rounded-full object-cover border border-slate-200" alt={selectedContact.name} />
                ) : (
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {selectedContact.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{selectedContact.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedContact.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMessagesTrayOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4">Últimas Mensagens</p>
              {contactMessages[selectedContact.id] && contactMessages[selectedContact.id].length > 0 ? (
                contactMessages[selectedContact.id].map((msg: any, i: number) => {
                  // Use database format: body field contains the message text
                  const content = msg.content || msg.body || msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'Mensagem sem texto';

                  // Use created_at from database or fallback to messageTimestamp
                  const timestamp = msg.created_at ? new Date(msg.created_at) : (msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date());
                  const time = timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const date = timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                  return (
                    <div key={msg.id || i} className="flex flex-col gap-1 items-start">
                      <div className="p-3 rounded-2xl max-w-[85%] border shadow-sm bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white">
                        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{date} às {time}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-10">
                  <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                  <p className="text-sm">Nenhuma mensagem encontrada para este contato.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
              <button
                onClick={() => fetchContactMessages(selectedContact, true)}
                disabled={isRefreshing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-all text-sm disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin' : ''}`}>
                  {isRefreshing ? 'sync' : 'refresh'}
                </span>
                {isRefreshing ? 'Atualizando...' : 'Atualizar Histórico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckboxItem = ({ title, description, checked, onChange }: any) => (
  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
    <input
      checked={checked}
      onChange={onChange}
      className="mt-1 w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary dark:bg-slate-800 dark:border-slate-600"
      type="checkbox"
    />
    <div>
      <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  </label>
);

const ChatSourceItem = ({ name, type, initials, imageUrl, color, online, active, grayscale, onToggle, lastMessage, timestamp, onViewMessages }: any) => {
  const time = timestamp ? new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`group flex flex-col p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 mb-1 ${grayscale ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <div className="relative size-10 rounded-full shrink-0">
              <img className={`size-10 rounded-full object-cover ${grayscale ? 'grayscale' : ''}`} src={imageUrl} alt={name} />
              {online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1a2632] rounded-full"></span>}
            </div>
          ) : (
            <div className={`relative size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${color || 'bg-primary/10 text-primary'}`}>
              {initials}
              {online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#1a2632] rounded-full"></span>}
            </div>
          )}
          <div className="flex flex-col">
            <p className={`text-sm font-bold text-slate-900 dark:text-white ${grayscale ? 'font-medium' : ''}`}>{name}</p>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-slate-400">{type === 'Grupo' ? 'group' : type === 'Business' ? 'business' : 'person'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onViewMessages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100"
            title="Ver mensagens"
          >
            <span className="material-symbols-outlined text-[20px]">forum</span>
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={active}
              onChange={onToggle}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {lastMessage && (
        <div className="mt-2 ml-[52px] flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic">
              "{lastMessage}"
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">{time}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationConfig;
