import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { VersixLogo } from '../components/BrandedIcons';
import Button from '../components/Button';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            title: 'Revisão Inteligente',
            description: 'Nossa IA processa suas mensagens do WhatsApp e classifica despesas e receitas automaticamente.',
            icon: 'psychology',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            title: 'Dashboard 360°',
            description: 'Uma visão completa do seu negócio com estatísticas em tempo real e gráficos dinâmicos.',
            icon: 'dashboard',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Cobrança Automatizada',
            description: 'Gestão de cheques devolvidos e devoluções integrada diretamente ao seu fluxo de caixa.',
            icon: 'account_balance_wallet',
            color: 'text-teal-500',
            bg: 'bg-teal-500/10'
        },
        {
            title: 'Multi-empresa',
            description: 'Gerencie múltiplos domínios e empresas em uma única plataforma segura e isolada.',
            icon: 'domain',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 font-sans selection:bg-emerald-500/30 selection:text-emerald-900 text-slate-900 dark:text-slate-100 overflow-x-hidden">

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200 dark:border-slate-800 py-3 shadow-sm' : 'bg-transparent border-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center">
                        <VersixLogo className="h-10 md:h-12 w-auto" />
                    </Link>

                    <div className="flex items-center gap-4 md:gap-8">
                        <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">
                            Entrar
                        </Link>
                        <Button onClick={() => navigate('/signup')} className="h-10 px-6 shadow-lg shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 border-none text-white">
                            Começar Agora
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl px-6 pointer-events-none opacity-30 dark:opacity-40">
                    <div className="absolute -top-32 -left-24 size-[600px] bg-emerald-500 rounded-full blur-[140px] opacity-20 animate-pulse"></div>
                    <div className="absolute top-20 -right-24 size-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 delay-1000 animate-pulse"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Sistema de Gestão com IA
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1] mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        A revolução financeira<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600">
                            agora é Versix AI.
                        </span>
                    </h1>

                    <p className="max-w-3xl mx-auto text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 mb-14 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200 font-medium">
                        Transforme dados em decisões. Nossa inteligência artificial processa seu WhatsApp, organiza suas contas e dá visibilidade total ao seu negócio em segundos.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                        <Button onClick={() => navigate('/signup')} className="w-full sm:w-auto h-16 px-12 text-lg font-bold shadow-2xl shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 border-none text-white transition-all hover:scale-105 active:scale-95">
                            Começar Teste Grátis
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto h-16 px-12 text-lg font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95">
                            Ver Demonstração
                        </Button>
                    </div>

                    {/* System Showcase Image */}
                    <div className="mt-24 relative max-w-6xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
                        <div className="absolute -inset-10 bg-gradient-to-t from-[#fafafa] dark:from-slate-950 via-transparent to-transparent z-20"></div>
                        <div className="relative group p-2 rounded-[2.5rem] bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_0_100px_-20px_rgba(16,185,129,0.3)]">
                            <img
                                src="/img/dashboard_showcase.png"
                                alt="Versix AI Dashboard"
                                className="w-full h-auto rounded-[2rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]"
                            />

                            {/* Floating elements for extra premium look */}
                            <div className="absolute -top-10 -right-10 hidden lg:block animate-bounce-slow">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-emerald-600">trending_up</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Crescimento</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">+24.5% este mês</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 bg-white dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">O sistema definitivo para sua empresa</h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">Tudo o que você precisa para uma gestão impecável, centralizado em uma plataforma poderosa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {features.map((feature, idx) => (
                            <div key={idx} className="group p-10 rounded-3xl bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/50 hover:border-emerald-500/50 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)] transition-all duration-500 h-full backdrop-blur-sm">
                                <div className={`size-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm shadow-black/5`}>
                                    <span className={`material-symbols-outlined text-[36px] ${feature.color}`}>{feature.icon}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI & WhatsApp Highlight */}
            <section className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="flex-1 space-y-10 order-2 lg:order-1">
                            <div className="relative group max-w-md mx-auto lg:mx-0">
                                <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src="/img/whatsapp_showcase.png"
                                    alt="Versix AI WhatsApp"
                                    className="relative w-full h-auto rounded-[3rem] shadow-2xl border-8 border-white dark:border-slate-800 rotate-2 translate-y-4 hover:rotate-0 hover:translate-y-0 transition-all duration-700"
                                />
                            </div>
                        </div>

                        <div className="flex-1 space-y-8 order-1 lg:order-2 text-center lg:text-left">
                            <div className="inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] text-sm">
                                <span className="size-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                Revisão Inteligente via WhatsApp
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
                                A IA que trabalha por você.
                            </h2>
                            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                Esqueça as planilhas manuais. No Versix AI, a gestão acontece onde você está. Envie uma mensagem e nossa IA organiza tudo em tempo real.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                {[
                                    { text: 'Extração inteligente de dados', icon: 'auto_awesome' },
                                    { text: 'Classificação automática', icon: 'category' },
                                    { text: 'Sincronização bancária', icon: 'account_balance' },
                                    { text: 'Controle de fluxo de caixa', icon: 'payments' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                                        <span className="material-symbols-outlined text-emerald-600">{item.icon}</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-bold text-sm tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <Button onClick={() => navigate('/signup')} size="lg" className="h-16 px-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 border-none text-white shadow-xl shadow-emerald-500/20 group">
                                    Experimentar Agora
                                    <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto rounded-[3.5rem] bg-slate-900 dark:bg-emerald-900/10 border border-slate-800 dark:border-emerald-500/20 p-12 md:p-24 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-[400px] bg-emerald-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
                    <div className="relative z-10 space-y-10">
                        <h2 className="text-4xl md:text-7xl font-black text-white leading-tight tracking-tighter">Pronto para elevar sua<br />gestão financeira?</h2>
                        <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-2xl mx-auto">Junte-se a centenas de empresas que já automatizaram seus processos com o Versix AI.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Button onClick={() => navigate('/signup')} className="w-full sm:w-auto h-16 px-12 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 border-none text-white shadow-2xl shadow-emerald-600/20">
                                Criar Minha Conta Grátis
                            </Button>
                        </div>
                        <p className="text-slate-500 font-medium">Sem necessidade de cartão de crédito. Teste por 14 dias.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-20 text-center md:text-left">
                        <div className="md:col-span-2 space-y-8">
                            <VersixLogo className="h-12 w-auto mx-auto md:mx-0" />
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed text-lg font-medium mx-auto md:mx-0">
                                A revolução na gestão financeira para pequenas e médias empresas. Inteligência, simplicidade e agilidade em um só lugar.
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                {['facebook', 'instagram', 'linkedin', 'twitter'].map(social => (
                                    <a key={social} href="#" className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all transform hover:-translate-y-1">
                                        <span className="material-symbols-outlined text-[20px]">{`share`}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm">Plataforma</h4>
                            <ul className="space-y-4 text-base font-bold text-slate-500 dark:text-slate-400">
                                <li><Link to="/login" className="hover:text-emerald-600 transition-colors">Entrar no Sistema</Link></li>
                                <li><Link to="/signup" className="hover:text-emerald-600 transition-colors">Criar Conta</Link></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Recursos</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">API & Integrações</a></li>
                            </ul>
                        </div>

                        <div className="space-y-8">
                            <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm">Suporte</h4>
                            <ul className="space-y-4 text-base font-bold text-slate-500 dark:text-slate-400">
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Central de Ajuda</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacidade</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Termos de Uso</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Falar com Consultor</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                        <p className="text-slate-400 font-bold text-sm leading-none">© 2026 Versix AI. Todos os direitos reservados.</p>
                        <div className="flex items-center gap-10 text-slate-400 font-black tracking-[0.2em] text-[10px] uppercase">
                            <span>Brasil</span>
                            <span>Inovação</span>
                            <span>Inteligência</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
