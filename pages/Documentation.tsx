import React from 'react';
import PageHeader from '../components/PageHeader';
import { WhatsAppIcon } from '../components/BrandedIcons';

const Documentation: React.FC = () => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const navItems = [
        { id: 'visao-geral', label: 'Visão Geral', icon: 'rocket_launch' },
        { id: 'guia-uso', label: 'Guia de Uso', icon: 'handyman' },
        { id: 'integracoes', label: 'Integrações', icon: 'extension' },
        { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', sub: true },
        { id: 'ia', label: 'Inteligência Artificial', icon: 'psychology', sub: true },
        { id: 'faq', label: 'FAQ & Suporte', icon: 'help' },
    ];

    return (
        <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <PageHeader
                title="Documentação do Sistema"
                description="Guia completo de uso, configurações e integrações do Versix AI."
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation - Sticky on Desktop */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Conteúdo</h4>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 w-full text-left ${item.sub ? 'ml-4' : ''}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-12 pb-20">

                    {/* Section: Visão Geral */}
                    <section id="visao-geral" className="scroll-mt-24">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <span className="text-3xl">🚀</span> Visão Geral
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                O <span className="font-bold">Versix AI</span> é uma plataforma de gestão financeira que utiliza Inteligência Artificial para automatizar processos manuais, permitindo que você controle suas finanças, vendas e contatos diretamente de onde a comunicação acontece: o WhatsApp.
                            </p>
                        </div>
                    </section>

                    {/* Section: Guia de Uso */}
                    <section id="guia-uso" className="scroll-mt-24 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="text-3xl">🛠️</span> Guia de Uso
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-xs tracking-wider text-primary">01. Autenticação</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Acesse via e-mail corporativo. A segurança é gerida pelo Supabase Auth, garantindo isolamento total dos seus dados.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-xs tracking-wider text-primary">02. Dashboard</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Visualize saldo, receitas e despesas em tempo real. Acompanhe as tendências e pendências detectadas pela IA.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-xs tracking-wider text-primary">03. Operacional</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Gerencie Contatos, Vendedores e Vendas. O sistema monitora automaticamente o saldo devedor de cada cliente.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 uppercase text-xs tracking-wider text-primary">04. Cheques & Devoluções</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Controle total sobre Cheques Devolvidos e Devoluções de Mercadorias, com ajustes automáticos no extrato do cliente.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section: Integrações */}
                    <section id="integracoes" className="scroll-mt-24 space-y-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="text-3xl">🔌</span> Integrações
                        </h2>

                        {/* WhatsApp Detail */}
                        <div id="whatsapp" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-emerald-500/10 p-3 rounded-2xl">
                                    <WhatsAppIcon className="size-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">WhatsApp (Evolution API)</h3>
                                    <p className="text-sm text-slate-500 font-medium italic">Seu canal direto com o Versix AI</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                <p>A integração com WhatsApp permite que o sistema receba comprovantes e mensagens em tempo real para processamento.</p>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="font-bold mb-2 text-slate-900 dark:text-white">Como Conectar:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Vá em <strong>Ajustes &gt; WhatsApp</strong></li>
                                        <li>Clique em <strong>Criar Instância</strong></li>
                                        <li>Gere o <strong>QR Code</strong> e escaneie com seu celular.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* AI Detail */}
                        <div id="ia" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm scroll-mt-24 overflow-hidden relative">
                            <span className="material-symbols-outlined absolute right-[-20px] top-[-20px] text-[120px] text-primary/5 opacity-50">smart_toy</span>
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="bg-primary/10 p-3 rounded-2xl">
                                    <span className="material-symbols-outlined text-3xl text-primary">smart_toy</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Inteligência Artificial</h3>
                                    <p className="text-sm text-slate-500 font-medium italic">Revisão Inteligente & Automação</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed relative z-10">
                                <p>Utilizamos os modelos mais avançados (Llama 3.3, Claude 3.5, Gemini 1.5, GPT-4o) para processar seus dados.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
                                        <span className="material-symbols-outlined text-primary mb-2">upload_file</span>
                                        <p className="font-bold text-xs text-slate-900 dark:text-white">1. Envie</p>
                                        <p className="text-[10px]">Comprovante via WhatsApp</p>
                                    </div>
                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
                                        <span className="material-symbols-outlined text-primary mb-2">psychology</span>
                                        <p className="font-bold text-xs text-slate-900 dark:text-white">2. Processamos</p>
                                        <p className="text-[10px]">IA extrai valor, data e categoria</p>
                                    </div>
                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
                                        <span className="material-symbols-outlined text-primary mb-2">verified</span>
                                        <p className="font-bold text-xs text-slate-900 dark:text-white">3. Aprove</p>
                                        <p className="text-[10px]">Confira na aba Revisão IA</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: FAQ */}
                    <section id="faq" className="scroll-mt-24">
                        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-6">Dúvidas Frequentes</h2>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-bold text-primary-foreground mb-1">O QR Code não aparece?</h4>
                                        <p className="text-sm text-slate-300">Clique em "Atualizar" ou tente excluir a instância e criar uma nova na aba de ajustes.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary-foreground mb-1">A IA não classificou minha mensagem?</h4>
                                        <p className="text-sm text-slate-300">Certifique-se de que a imagem está legível e nítida. O sistema funciona melhor com comprovantes bancários padrão.</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary-foreground mb-1">Meus dados estão seguros?</h4>
                                        <p className="text-sm text-slate-300">Sim, utilizamos infraestrutura de ponta com isolamento total de dados entre clientes.</p>
                                    </div>
                                </div>
                            </div>
                            <span className="material-symbols-outlined absolute right-[-40px] bottom-[-40px] text-[200px] text-white/5 -rotate-12">help_outline</span>
                        </div>
                    </section>

                    <footer className="pt-10 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
                        <p>© 2026 Versix AI - Eficiência Financeira Inteligente</p>
                    </footer>

                </div>
            </div>
        </div>
    );
};

export default Documentation;
