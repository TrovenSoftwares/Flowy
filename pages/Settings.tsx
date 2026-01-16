import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { Link } from 'react-router-dom';
import { evolutionApi } from '../lib/evolution';
import { WhatsAppIcon } from '../components/BrandedIcons';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import Input from '../components/Input';
import InputMask from '../components/InputMask';
import Button from '../components/Button';
import { MASKS } from '../utils/utils';
import { SkeletonCard, SkeletonTable } from '../components/Skeleton';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    avatar_url: '',
    company_name: '',
    cnpj: ''
  });


  // WhatsApp States
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [status, setStatus] = useState<'open' | 'connecting' | 'closed'>('closed');
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = React.useState(false);
  const [newInstanceName, setNewInstanceName] = React.useState('');
  const [isEditingInstance, setIsEditingInstance] = React.useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = React.useState(false);
  const [apiError, setApiError] = React.useState<{ title: string; message: string; details?: any } | null>(null);
  const [systemVersion, setSystemVersion] = useState({ version: '...', description: 'Carregando...' });
  const [changelogs, setChangelogs] = useState<any[]>([]);
  const [loadingChangelogs, setLoadingChangelogs] = useState(false);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loadingAiLogs, setLoadingAiLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Webhook Constants (Same as IntegrationConfig)
  const DEFAULT_WEBHOOK_URL = 'https://workflows.troven.com.br/webhook/financeiro-ai';
  const DEFAULT_WEBHOOK_EVENTS = [
    "GROUPS_UPSERT",
    "MESSAGES_UPSERT"
  ];

  useEffect(() => {
    fetchSettings();
    fetchChangelogs();
    fetchAiLogs();

    // Check for tab parameter in URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfile({
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: 'Administrador',
      });

      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('profile_data')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: instanceData } = await supabase
        .from('instances')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (settings) {
        // Load instances from instances table (not ai_config)
        if (instanceData?.name) {
          setInstanceName(instanceData.name);
          setStatus(instanceData.status as any || 'closed');
        }
        if (settings.profile_data) {
          setProfile(prev => ({
            ...prev,
            ...settings.profile_data,
            email: user.email || prev.email
          }));
        }
      } else if (instanceData?.name) {
        // Case where no user_settings but instance exists
        setInstanceName(instanceData.name);
        setStatus(instanceData.status as any || 'closed');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChangelogs = async () => {
    setLoadingChangelogs(true);
    try {
      const { data, error } = await supabase
        .from('system_changelogs')
        .select('*')
        .order('version', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "public.system_changelogs" does not exist')) {
          console.log('Changelogs table not found, using mock data.');
          const mockData = [
            {
              version: '1.2.2',
              type: 'new',
              title: 'Nova Experiência Flowy',
              description: 'Lançamento da v1.2.2 com Dashboard Comparativo, Atalhos de Teclado, Tutorial Interativo, Exportação de Gráficos em PDF e Busca Global em Tempo Real.'
            },
            {
              version: '1.2.1',
              type: 'new',
              title: 'Rebranding Flowy',
              description: 'Transformação completa da identidade visual do sistema de Phyr para Flowy, incluindo logos, ícones, e-mails e exportações.'
            },
            { version: '1.1.0', type: 'improvement', title: 'Responsividade Tablet', description: 'Otimização de grids e menus para tablets, garantindo uma experiência premium em telas intermediárias.' },
            { version: '1.1.0', type: 'improvement', title: 'Segurança & DevTools', description: 'Implementação de bloqueios contra inspeção de código e atalhos de desenvolvedor para proteger a propriedade intelectual.' },
            { version: '1.0.1', type: 'new', title: 'Revisão Inteligente WhatsApp', description: 'Integração completa com WhatsApp para processamento automático de transações financeiras via IA.' }
          ];
          setChangelogs(mockData);
          if (mockData.length > 0) {
            setSystemVersion({ version: mockData[0].version, description: mockData[0].title });
          }
        } else {
          throw error;
        }
      } else {
        setChangelogs(data || []);
        if (data && data.length > 0) {
          setSystemVersion({ version: data[0].version, description: data[0].title });
        }
      }
    } catch (error) {
      console.error('Error loading changelogs:', error);
    } finally {
      setLoadingChangelogs(false);
    }
  };

  const fetchAiLogs = async () => {
    setLoadingAiLogs(true);
    try {
      const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('status', 'ignored') // Mostrar apenas mensagens ignoradas
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const { data: contacts } = await supabase
        .from('contacts')
        .select('name, whatsapp_id, phone');

      const mappedLogs = (messages || []).map(m => {
        const isGroup = m.remote_jid?.includes('@g.us');

        // Prioridade 1: sender_name salvo no banco
        if (m.sender_name) {
          return {
            ...m,
            contact_name: m.sender_name
          };
        }

        // Para grupos, usar o push_name ou extrair do jid
        if (isGroup) {
          return {
            ...m,
            contact_name: m.push_name || m.participant_name || 'Grupo'
          };
        }

        // Para contatos individuais - melhorar matching por últimos dígitos
        const jidClean = m.remote_jid?.split('@')[0].replace(/\D/g, '') || '';
        const jidLast9 = jidClean.slice(-9);
        const jidLast8 = jidClean.slice(-8);

        const contact = contacts?.find(c => {
          if (c.whatsapp_id === m.remote_jid) return true;
          if (c.phone) {
            const pClean = c.phone.replace(/\D/g, '');
            const pLast9 = pClean.slice(-9);
            const pLast8 = pClean.slice(-8);
            // Match por últimos 8-9 dígitos (ignora DDI e DDD)
            return pLast9 === jidLast9 || pLast8 === jidLast8;
          }
          return false;
        });

        return {
          ...m,
          contact_name: contact?.name || m.push_name || m.remote_jid?.split('@')[0] || 'Desconhecido'
        };
      });

      setAiLogs(mappedLogs);
    } catch (error) {
      console.error('Error loading AI logs:', error);
    } finally {
      setLoadingAiLogs(false);
    }
  };

  const handleViewTransaction = async (msgId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .contains('ai_metadata', { whatsapp_message_id: msgId })
        .maybeSingle();

      if (error) throw error;
      if (data) {
        navigate(`/transactions?id=${data.id}`);
      } else {
        toast.error('Transação não encontrada ou removida.');
      }
    } catch (error) {
      console.error('Error finding transaction:', error);
      toast.error('Erro ao localizar transação.');
    }
  };

  const handleTeachIA = async (msgId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ status: 'pending', ignore_reason: null })
        .eq('id', msgId);

      if (error) throw error;
      toast.success('Mensagem restaurada para revisão.');
      fetchAiLogs();
    } catch (error) {
      console.error('Error teaching IA:', error);
      toast.error('Erro ao atualizar mensagem.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      await supabase.auth.updateUser({
        data: { full_name: profile.name, avatar_url: profile.avatar_url }
      });

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          profile_data: profile,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  // handleSaveAI removed - ai_config no longer used

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];
      setUploadingImage(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Imagem carregada! Não esqueça de salvar o perfil.');

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const renderTabButton = (id: string, label: string, icon: string, badge?: boolean) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl w-full text-left
        ${activeTab === id
          ? 'bg-primary/10 text-primary'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
    >
      {id === 'whatsapp' ? (
        <WhatsAppIcon className="size-5" />
      ) : (
        <span className={`material-symbols-outlined text-[20px] ${activeTab === id ? 'fill-current' : ''}`}>{icon}</span>
      )}
      <span className="flex-1">{label}</span>
      {badge && <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">IA</span>}
      {activeTab === id && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full"></span>}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500 md:p-8 p-4">
      {/* Page Header */}
      <PageHeader
        title="Ajustes & Preferências"
        description="Gerencie seu perfil, integrações e personalize o sistema para o seu negócio."
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2 lg:sticky lg:top-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-800">
            {renderTabButton('perfil', 'Meu Perfil', 'account_circle')}
            {renderTabButton('whatsapp', 'WhatsApp', 'chat', false)}
            {renderTabButton('ai_logs', 'Logs da IA', 'list_alt', true)}
            {renderTabButton('ia', 'Integração IA', 'smart_toy', false)}
            {renderTabButton('seguranca', 'Segurança', 'lock')}
            {renderTabButton('notificacoes', 'Notificações', 'notifications')}
            {renderTabButton('sistema', 'Sistema', 'settings_suggest')}
          </div>

          {/* Quick Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 text-white shadow-lg mt-4 hidden lg:block">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-amber-400">workspace_premium</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Plano Atual</p>
                <p className="font-bold">Premium</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Você tem acesso a todas as funcionalidades de IA e automação.
            </p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
              <div className="bg-amber-400 h-1.5 rounded-full w-[80%]"></div>
            </div>
            <p className="text-[10px] text-slate-400 text-right">Renova em 12/2026</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">

          {/* Profile Section */}
          {activeTab === 'perfil' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loading ? (
                <div className="space-y-6">
                  <SkeletonCard />
                  <SkeletonCard rows={3} />
                </div>
              ) : (
                <>
                  {/* Profile Header Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-900/20 -z-0"></div>

                    <div className="relative z-10 group cursor-pointer" onClick={triggerFileInput}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="w-32 h-32 rounded-full ring-4 ring-white dark:ring-slate-800 shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center relative group-hover:ring-primary/50 transition-all duration-500">
                        {uploadingImage ? (
                          <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
                        ) : profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-slate-300 transition-transform duration-700 group-hover:scale-110">{profile.name.charAt(0)}</span>
                        )}

                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]">
                          <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg transform translate-x-1 translate-y-1 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[18px] block">edit</span>
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left relative z-10 pt-4 md:pt-0">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{profile.name || 'Seu Nome'}</h2>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                          {profile.role || 'Administrador'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800">
                          {profile.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">badge</span>
                        Informações Básicas
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Input
                          label="Nome Completo"
                          value={profile.name}
                          onChange={e => setProfile({ ...profile, name: e.target.value })}
                          placeholder="Seu nome completo"
                          leftIcon={<span className="material-symbols-outlined text-[20px]">person</span>}
                        />
                      </div>

                      <div className="space-y-2">
                        <Input
                          label="Cargo / Função"
                          value={profile.role}
                          onChange={e => setProfile({ ...profile, role: e.target.value })}
                          placeholder="Ex: Gerente Financeiro"
                          leftIcon={<span className="material-symbols-outlined text-[20px]">work</span>}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <InputMask
                          label="Telefone / WhatsApp"
                          value={profile.phone}
                          onAccept={val => setProfile({ ...profile, phone: val })}
                          mask={MASKS.PHONE}
                          placeholder="(00) 00000-0000"
                          leftIcon={<span className="material-symbols-outlined text-[20px]">call</span>}
                          helperText="Usado para notificações de segurança e identificação da conta."
                        />
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800 md:col-span-2 my-2"></div>

                      <div className="space-y-2">
                        <Input
                          label="Nome da Empresa"
                          value={profile.company_name}
                          onChange={e => setProfile({ ...profile, company_name: e.target.value })}
                          placeholder="Nome fantasia da sua empresa"
                          leftIcon={<span className="material-symbols-outlined text-[20px]">store</span>}
                        />
                      </div>

                      <div className="space-y-2">
                        <InputMask
                          label="CNPJ"
                          value={profile.cnpj}
                          onAccept={val => setProfile({ ...profile, cnpj: val })}
                          mask={MASKS.CNPJ}
                          placeholder="00.000.000/0000-00"
                          leftIcon={<span className="material-symbols-outlined text-[20px]">corporate_fare</span>}
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        isLoading={saving}
                        leftIcon={<span className="material-symbols-outlined text-[20px]">save</span>}
                        className="px-8"
                      >
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* AI Config Section - Styled */}
          {activeTab === 'ia' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2">Inteligência Artificial</h2>
                  <p className="text-white/80 max-w-xl text-sm leading-relaxed">
                    Conecte os modelos de IA mais avançados para automatizar a leitura de mensagens, classificação financeira e insights do seu negócio.
                  </p>
                </div>
                <span className="material-symbols-outlined absolute right-[-20px] bottom-[-40px] text-[180px] text-white/10 rotate-12">smart_toy</span>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-primary">verified</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">IA Padronizada</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                  As chaves de API e modelos de Inteligência Artificial agora são gerenciados globalmente para garantir a melhor performance e segurança.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">Groq (Llama 3.3)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">Claude 3.5</span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">Gemini 1.5</span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">GPT-4o</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Placeholder */}
          {activeTab === 'seguranca' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-slate-100 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-slate-400">shield_lock</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Segurança da Conta</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                As configurações de senha e autenticação de dois fatores são gerenciadas pelo provedor de login (Supabase Auth).
              </p>
            </div>
          )}

          {/* WhatsApp Config Section */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2">Conexão WhatsApp</h2>
                  <p className="text-white/80 max-w-xl text-sm leading-relaxed">
                    Vincule sua conta do WhatsApp para que a IA possa processar despesas, faturas e boletos diretamente pelo chat.
                  </p>
                </div>
                <WhatsAppIcon className="absolute right-[-20px] bottom-[-40px] size-[180px] text-white/10 rotate-12" />
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Status da Conexão
                  </h2>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : status === 'connecting' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                    <span className={`w-2 h-2 rounded-full ${status === 'open' ? 'bg-green-500' : status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {status === 'open' ? 'Conectado' : status === 'connecting' ? 'Aguardando' : 'Desconectado'}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800" data-tour="settings-whatsapp-connection">
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                          {instanceName || 'WhatsApp não configurado'}
                        </h3>
                        {instanceName ? (
                          <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors"
                            title="Excluir Instância"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setNewInstanceName(`wpp-${Math.random().toString(36).substring(2, 8)}`);
                              setIsInstanceModalOpen(true);
                              setIsEditingInstance(false);
                            }}
                            className="ml-2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-1 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[14px]">add_circle</span>
                            Criar Instância
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {status === 'open'
                          ? 'Sua conta está ativa e pronta para uso.'
                          : 'Escaneie o QR Code para conectar sua conta (Clique em Gerar se não houver).'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {status === 'open' ? (
                        <button
                          onClick={() => setIsDisconnectModalOpen(true)}
                          className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">logout</span>
                          Desconectar
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!instanceName) {
                              setIsInstanceModalOpen(true);
                              return;
                            }
                            setSaving(true);
                            try {
                              try {
                                const data = await evolutionApi.connectInstance(instanceName);
                                setQrCode(data.base64 || data.code);
                                setStatus('connecting');
                                toast.success('QR Code gerado!');
                              } catch (connectError: any) {
                                if (connectError?.message?.includes('not found') || (connectError?.response?.status === 404)) {
                                  // Recreate atomic
                                  const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

                                  const extraConfig = {
                                    rejectCall: false,
                                    groupsIgnore: false,
                                    alwaysOnline: false,
                                    readMessages: false,
                                    readStatus: false,
                                    syncFullHistory: true,
                                    webhook: {
                                      url: DEFAULT_WEBHOOK_URL,
                                      byEvents: false,
                                      base64: true,
                                      headers: {
                                        "autorization": `Bearer ${newToken}`,
                                        "Content-Type": "application/json"
                                      },
                                      events: DEFAULT_WEBHOOK_EVENTS
                                    }
                                  };

                                  await evolutionApi.createInstance(instanceName, newToken, extraConfig);
                                  const data = await evolutionApi.connectInstance(instanceName);
                                  setQrCode(data.base64 || data.code);
                                  setStatus('connecting');

                                  // Sync to DB
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (user) {
                                    await supabase.from('instances').upsert({
                                      user_id: user.id,
                                      name: instanceName,
                                      token: newToken,
                                      status: 'connecting',
                                      updated_at: new Date().toISOString()
                                    }, { onConflict: 'user_id,name' });
                                  }
                                  toast.success('Instância recriada e QR Code gerado!');
                                } else {
                                  throw connectError;
                                }
                              }
                            } catch (e: any) {
                              console.error(e);
                              setApiError({
                                title: 'Erro ao conectar/criar',
                                message: 'Falha na comunicação com a API do WhatsApp.',
                                details: e
                              });
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                          disabled={saving}
                        >
                          <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                          {saving ? 'Gerando...' : 'Gerar QR Code'}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!instanceName) return;
                          const s = await evolutionApi.getInstanceStatus(instanceName);
                          setStatus(s);
                          toast.success('Status atualizado!');
                        }}
                        className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        disabled={!instanceName}
                      >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Atualizar
                      </button>
                    </div>
                  </div>

                  <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {qrCode ? (
                      <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" className="w-full h-full" />
                    ) : status === 'open' ? (
                      <div className="flex flex-col items-center text-green-500">
                        <span className="material-symbols-outlined text-5xl">check_circle</span>
                        <p className="text-xs font-bold mt-2">CONECTADO</p>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <span className="material-symbols-outlined text-slate-300 text-5xl">qr_code_scanner</span>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Aguardando geração do código</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Logs Section */}
          {activeTab === 'ai_logs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <WhatsAppIcon className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Logs de Processamento</h3>
                      <p className="text-xs text-slate-500">Histórico de mensagens lidas e classificadas pela IA</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchAiLogs}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 group"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${loadingAiLogs ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
                  </button>
                </div>

                {loadingAiLogs ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-slate-400 text-sm">Escaneando logs...</p>
                  </div>
                ) : aiLogs.length === 0 ? (
                  <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">history_toggle_off</span>
                    <p className="text-slate-500 font-medium">Nenhum log de processamento encontrado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                          <th className="pb-4 px-4">Data/Hora</th>
                          <th className="pb-4 px-4">Origem</th>
                          <th className="pb-4 px-4">Mensagem</th>
                          <th className="pb-4 px-4">Resultado</th>
                          <th className="pb-4 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {aiLogs.map((log) => (
                          <tr key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4 font-mono text-[10px] text-slate-400">
                              {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {log.contact_name}
                                </span>
                                <span className="text-[10px] text-slate-400">{log.instance_name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-[300px]" title={log.content}>
                                {log.content}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              {log.status === 'processed' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                  Processado
                                </span>
                              ) : log.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                                  Aguardando Revisão
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider w-fit">
                                    <span className="material-symbols-outlined text-[14px]">block</span>
                                    Ignorado
                                  </span>
                                  {log.ignore_reason && (
                                    <span className="text-[9px] text-slate-400 italic">Motivo: {log.ignore_reason}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setIsLogModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-primary transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800"
                                  title="Ver Detalhes JSON"
                                >
                                  <span className="material-symbols-outlined text-[18px]">code</span>
                                </button>

                                {log.status === 'processed' && (
                                  <button
                                    onClick={() => handleViewTransaction(log.id)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800"
                                    title="Ver Transação"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                  </button>
                                )}

                                {log.status === 'pending' && (
                                  <button
                                    onClick={() => navigate('/review')}
                                    className="p-1.5 text-slate-400 hover:text-primary transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800"
                                    title="Ir para Central de Revisão"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                                  </button>
                                )}

                                {(log.status === 'error' || log.status === 'discarded') && (
                                  <button
                                    onClick={() => handleTeachIA(log.id)}
                                    className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800"
                                    title="Ensinar IA (Mover para Revisão)"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tips for better IA learning */}
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Como o "Ensinar IA" funciona?</h4>
                  <p className="text-xs text-amber-800/70 dark:text-amber-400/70 mt-1 leading-relaxed">
                    Se você notar que uma mensagem financeira válida foi descartada, clique em **"Ensinar IA"**.
                    A mensagem voltará para a sua **Central de Revisão**, onde você poderá aprová-la manualmente.
                    Isso ajuda nosso modelo a entender melhor o padrão das suas conversas no futuro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Log Detail Modal */}
          <Modal
            isOpen={isLogModalOpen}
            onClose={() => setIsLogModalOpen(false)}
            title="Detalhes da Mensagem (Payload)"
            size="lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">chat</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedLog?.contact_name || 'Desconhecido'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{selectedLog?.remote_jid}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">{new Date(selectedLog?.created_at).toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-slate-400">{selectedLog?.instance_name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Mensagem Original</p>
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-sm text-slate-800 dark:text-slate-200 italic">"{selectedLog?.content}"</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Dados Brutos (JSON)</p>
                <div className="relative group">
                  <pre className="p-4 bg-slate-950 text-emerald-400 text-[10px] font-mono rounded-xl overflow-auto max-h-[300px] border border-slate-800 custom-scrollbar">
                    {JSON.stringify(selectedLog?.raw_data, null, 2)}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedLog?.raw_data, null, 2));
                      toast.success('JSON copiado!');
                    }}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={() => setIsLogModalOpen(false)}>Fechar Janela</Button>
              </div>
            </div>
          </Modal>

          {activeTab === 'sistema' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16"></div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Sobre o Sistema
                </h3>

                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg shadow-primary/20 p-2">
                    <img src="/favicon.svg" alt="Flowy" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xl">Flowy ERP</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                        Versão {systemVersion.version}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 text-nowrap">
                        {systemVersion.description || 'Premium'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 text-xs">
                    <div className="text-slate-500">
                      ID da Instalação: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">8f92-vrsx-9921</span>
                    </div>
                    <div className="text-slate-500">
                      Ambiente: <span className="text-green-600 dark:text-green-400 font-bold">Produção</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changelog Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Histórico de Atualizações
                  </h3>
                  <button
                    onClick={fetchChangelogs}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${loadingChangelogs ? 'animate-spin' : ''}`}>refresh</span>
                  </button>
                </div>

                {loadingChangelogs ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-slate-400 text-sm">Carregando novidades...</p>
                  </div>
                ) : (
                  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                    {changelogs.map((log, index) => (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:border-primary/20 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors duration-500">
                          <span className={`material-symbols-outlined text-[18px] ${log.type === 'new' ? 'text-green-500' : log.type === 'improvement' ? 'text-blue-500' : 'text-amber-500'} group-hover:text-white`}>
                            {log.type === 'new' ? 'add_box' : log.type === 'improvement' ? 'trending_up' : 'settings'}
                          </span>
                        </div>
                        {/* Content */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-md transition-all duration-500">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-white">{log.title}</h4>
                            <time className="font-mono text-[10px] font-bold uppercase text-slate-400">v{log.version}</time>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${log.type === 'new' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              log.type === 'improvement' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                              {log.type === 'new' ? 'Novo' : log.type === 'improvement' ? 'Melhoria' : 'Correção'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {log.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={async () => {
          if (!instanceName) return;
          setSaving(true);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Remove from instances table
            const { error: dbError } = await supabase.from('instances').delete().eq('name', instanceName).eq('user_id', user.id);
            if (dbError) throw dbError;

            // 2. Delete from Evolution API
            try { await evolutionApi.deleteInstance(instanceName); } catch (e) {
              console.warn('Failed to delete from Evolution (might already be deleted)', e);
            }

            setInstanceName(null);
            setStatus('closed');
            setQrCode(null);
            setIsDisconnectModalOpen(false);
            toast.success('WhatsApp e dados removidos.');
          } catch (e) {
            console.error(e);
            toast.error('Erro ao remover.');
          } finally {
            setSaving(false);
          }
        }}
        title="Remover WhatsApp?"
        message="Deseja desconectar e remover esta instância das suas configurações?"
        confirmLabel="Sim, Remover"
        type="danger"
      />

      {/* Instance Name Modal */}
      <Modal
        isOpen={isInstanceModalOpen}
        onClose={() => setIsInstanceModalOpen(false)}
        title={isEditingInstance ? 'Editar Nome da Instância' : 'Configurar WhatsApp'}
        footer={
          <>
            <Button
              onClick={() => setIsInstanceModalOpen(false)}
              variant="ghost"
              className="px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setSaving(true);
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;

                  const instanceToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

                  // 1. Prepare Atomic Config exactly as requested
                  const extraConfig = {
                    rejectCall: false,
                    groupsIgnore: false,
                    alwaysOnline: false,
                    readMessages: false,
                    readStatus: false,
                    syncFullHistory: true,
                    webhook: {
                      url: DEFAULT_WEBHOOK_URL,
                      byEvents: false,
                      base64: true,
                      headers: {
                        "autorization": `Bearer ${instanceToken}`,
                        "Content-Type": "application/json"
                      },
                      events: DEFAULT_WEBHOOK_EVENTS
                    }
                  };

                  await evolutionApi.createInstance(newInstanceName, instanceToken, extraConfig);

                  // 2. Save to dedicated instances table
                  const { error: dbError } = await supabase.from('instances').upsert({
                    user_id: user.id,
                    name: newInstanceName,
                    token: instanceToken,
                    status: 'connecting',
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'user_id,name' });

                  if (dbError) throw dbError;

                  setInstanceName(newInstanceName);
                  setIsInstanceModalOpen(false);
                  setIsEditingInstance(false);

                  if (isEditingInstance) {
                    toast.success('Instância renomeada! Necessário reconectar.');
                  } else {
                    toast.success('Pronto! Agora gere o QR Code.');
                  }
                } catch (e: any) {
                  console.error(e);
                  toast.error(e.message || 'Erro ao conectar instância.');
                } finally {
                  setSaving(false);
                }
              }}
              isLoading={saving}
              disabled={saving || !newInstanceName}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Input
            label="Nome da Instância"
            value={newInstanceName}
            autoFocus
            onChange={(e) => setNewInstanceName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="ex: minha-loja"
          />
        </div>
      </Modal>

      {/* Error Details Modal */}
      {apiError && (
        <Modal
          isOpen={!!apiError}
          onClose={() => setApiError(null)}
          title={apiError.title}
          size="lg"
          footer={
            <button
              onClick={() => setApiError(null)}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 text-sm"
            >
              Entendi
            </button>
          }
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400 font-medium">{apiError.message}</p>
            <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-[300px]">
              <pre className="text-pink-400 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(apiError.details, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settings;