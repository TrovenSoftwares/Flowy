import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { WhatsAppIcon } from './BrandedIcons';
import CustomSelect from './CustomSelect';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { evolutionApi } from '../lib/evolution';
import { toast } from 'react-hot-toast';

interface ChargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: {
        name: string;
        phone: string;
        balance: number;
    } | null;
}

const ChargeModal: React.FC<ChargeModalProps> = ({ isOpen, onClose, contact }) => {
    const [tone, setTone] = useState('friendly');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState('VersixAI');
    const [instanceName, setInstanceName] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: settings } = await supabase
                .from('user_settings')
                .select('profile_data')
                .eq('user_id', user.id)
                .maybeSingle();

            if (settings?.profile_data?.company_name) {
                setCompanyName(settings.profile_data.company_name);
            }

            // PRIORITÁRIO: Buscar instância SOMENTE na tabela instances (fonte confiável)
            const { data: instanceData } = await supabase
                .from('instances')
                .select('name, status')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (instanceData?.name && instanceData.status === 'open') {
                console.log('Instância ativa encontrada:', instanceData.name);
                setInstanceName(instanceData.name);
            } else {
                console.warn('Nenhuma instância WhatsApp ativa encontrada na tabela instances.');
                setInstanceName(null);
            }
        };

        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const generateMessage = (selectedTone: string, name: string, balance: number, company: string) => {
        const formattedBalance = balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

        switch (selectedTone) {
            case 'friendly':
                return `Olá, ${name}! Tudo bem? 😃\n\nPassando aqui apenas para te atualizar sobre uma pendência de R$ ${formattedBalance} no seu cadastro da ${company}.\n\nQualquer dúvida ou se precisar de algo, estamos à disposição! Abraços.`;
            case 'firm':
                return `Olá, ${name}. 🤝\n\nNotamos que o saldo de R$ ${formattedBalance} relativo aos nossos serviços ainda consta em aberto no sistema.\n\nGostaríamos de regularizar essa pendência para evitar qualquer interrupção em seu atendimento. Você poderia nos dar um retorno sobre a previsão de pagamento?`;
            case 'urgent':
                return `⚠️ ATENÇÃO: ${name}\n\nSeu débito de R$ ${formattedBalance} com a ${company} atingiu o prazo limite de negociação.\n\nPedimos a gentileza de entrar em contato IMEDIATAMENTE para regularizarmos sua situação e evitarmos medidas administrativas. Aguardamos seu retorno urgente.`;
            default:
                return '';
        }
    };

    useEffect(() => {
        if (contact) {
            setMessage(generateMessage(tone, contact.name, Math.abs(contact.balance), companyName));
        }
    }, [contact, tone, companyName]);

    if (!contact) return null;

    const handleSend = async () => {
        if (!contact) return;
        setLoading(true);
        try {
            let cleanPhone = contact.phone.replace(/\D/g, '');

            // Auto-add 55 prefix for Brazilian numbers if missing
            if (cleanPhone.length === 10 || cleanPhone.length === 11) {
                cleanPhone = '55' + cleanPhone;
            }

            if (instanceName) {
                console.log(`Tentando enviar via Evolution API (Instância: ${instanceName}, Telefone: ${cleanPhone})`);

                // Verificar status real da instância antes de enviar
                const realStatus = await evolutionApi.getInstanceStatus(instanceName);
                console.log(`Status real da instância ${instanceName}:`, realStatus);

                if (realStatus !== 'open') {
                    toast.error(`WhatsApp desconectado (${realStatus}). Reconecte em Ajustes > WhatsApp.`);
                    // Fallback para link manual
                    const encodedMessage = encodeURIComponent(message);
                    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
                    onClose();
                    return;
                }

                // Tenta enviar via API se houver instância conectada
                await evolutionApi.sendText(instanceName, cleanPhone, message);
                toast.success('Cobrança enviada com sucesso via WhatsApp!');
                onClose();
            } else {
                console.warn('Nenhuma instância do WhatsApp configurada. Usando link manual.');
                // Fallback para link manual
                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
                toast.success('Abrindo WhatsApp...');
                onClose();
            }
        } catch (error: any) {
            console.error('Erro detalhado ao enviar cobrança via Evolution:', error);

            // Se o erro for de instância não conectada ou similar, tenta o fallback manual
            toast.error('Falha no envio automático. Tentando via WhatsApp Web...');

            let cleanPhone = contact.phone.replace(/\D/g, '');
            if (cleanPhone.length === 10 || cleanPhone.length === 11) {
                cleanPhone = '55' + cleanPhone;
            }
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Enviar Cobrança via WhatsApp"
            size="md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="primary"
                        onClick={handleSend}
                        loading={loading}
                        className="bg-[#25D366] hover:bg-[#20ba5a] border-none text-white flex items-center gap-2"
                    >
                        <WhatsAppIcon className="size-5" />
                        Enviar Mensagem
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Resumo do Débito */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest">Saldo Devedor</p>
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-500">
                            R$ {Math.abs(contact.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="size-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-500 text-3xl">account_balance_wallet</span>
                    </div>
                </div>

                {/* Seletor de Tom */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">psychology</span>
                        Tom da Cobrança (IA)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'friendly', label: 'Amigável', icon: 'sentiment_satisfied' },
                            { value: 'firm', label: 'Firme', icon: 'gavel' },
                            { value: 'urgent', label: 'Urgente', icon: 'priority_high' }
                        ].map((t) => (
                            <button
                                key={t.value}
                                onClick={() => setTone(t.value)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${tone === t.value
                                    ? 'bg-primary/5 border-primary text-primary shadow-sm scale-[1.02]'
                                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px] mb-1">{t.icon}</span>
                                <span className="text-[10px] font-bold uppercase">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor de Mensagem */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">chat</span>
                        Preview da Mensagem
                    </label>
                    <div className="relative group">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all dark:text-white"
                            placeholder="Sua mensagem de cobrança..."
                        />
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-slate-400 font-medium">IA Formatada ✓</span>
                        </div>
                    </div>
                </div>

                <p className="text-[11px] text-slate-400 italic text-center">
                    A mensagem acima será aberta diretamente no WhatsApp do cliente após clicar em enviar.
                </p>
            </div>
        </Modal>
    );
};

export default ChargeModal;
