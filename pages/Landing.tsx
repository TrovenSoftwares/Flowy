import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PhyrLogo } from '../components/BrandedIcons';
import PublicFooter from '../components/PublicFooter';
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
            title: 'Primeiros Passos',
            description: 'Configuração inicial e conceitos básicos do zero para você começar a faturar hoje.',
            icon: 'rocket_launch'
        },
        {
            title: 'Gestão Financeira',
            description: 'Fluxo de caixa, PDV integrado e relatórios profissionais em um clique.',
            icon: 'account_balance'
        },
        {
            title: 'WhatsApp & IA',
            description: 'Conectando instâncias e Revisão Inteligente direto no seu mensageiro favorito.',
            icon: 'smart_toy'
        },
        {
            title: 'Segurança',
            description: 'Criptografia de ponta a ponta para manter seus dados financeiros protegidos.',
            icon: 'verified_user'
        }
    ];

    const plans = [
        {
            name: 'Essencial',
            price: '97',
            desc: 'Para pequenos negócios começando a organização.',
            features: [
                'Gestão de fluxo de caixa básica',
                '1 Usuário administrativo',
                'Até 500 lançamentos/mês',
                'Relatórios mensais em PDF'
            ],
            cta: 'Assinar agora',
            highlight: false
        },
        {
            name: 'Profissional',
            price: '197',
            desc: 'A solução completa para empresas em crescimento.',
            features: [
                'Tudo do plano Essencial',
                'Integração com WhatsApp & IA',
                'Até  usuários ilimitados',
                'Dashboard em tempo real',
                'Conciliação bancária automática'
            ],
            cta: 'Começar teste grátis',
            highlight: true
        },
        {
            name: 'Enterprise',
            price: 'Sob consulta',
            desc: 'Recursos avançados para operações complexas.',
            features: [
                'Tudo do plano Profissional',
                'Usuários ilimitados',
                'Gerente de conta exclusivo',
                'SLA de suporte prioritário',
                'Customizações via API'
            ],
            cta: 'Falar com vendas',
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display selection:bg-primary/30 text-slate-900 dark:text-slate-100 transition-colors duration-300">

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 py-3 shadow-sm' : 'bg-transparent border-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center">
                        <PhyrLogo className="h-10 md:h-12 w-auto" />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Produtos</a>
                        <a href="#pricing" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Preços</a>
                        <Link to="/documentation" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Documentação</Link>
                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                        <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
                            Entrar <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </Link>
                        <Button onClick={() => navigate('/signup')} className="h-11 px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 border-none text-white rounded-full">
                            Criar Conta Grátis
                        </Button>
                    </div>

                    <div className="md:hidden">
                        <span className="material-symbols-outlined cursor-pointer" onClick={() => navigate('/login')}>menu</span>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-primary font-bold text-xs mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </span>
                        Nova integração com IA generativa disponível
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 max-w-4xl mx-auto">
                        A gestão financeira que <span className="text-primary italic">evolui</span> com o seu negócio.
                    </h1>

                    <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600 dark:text-slate-400 mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                        Unifique seu fluxo de caixa, automação de PDV e inteligência artificial no WhatsApp para uma visão 360º do seu faturamento em tempo real.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                        <Button onClick={() => navigate('/signup')} className="w-full sm:w-auto h-16 px-12 text-xl font-bold shadow-2xl shadow-primary/25 bg-primary hover:bg-primary/90 border-none text-white transition-all hover:scale-105 active:scale-95 rounded-2xl">
                            Começar agora
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/help')} className="w-full sm:w-auto h-16 px-12 text-xl font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 rounded-2xl flex items-center gap-2">
                            <span className="material-symbols-outlined">play_circle</span>
                            Ver Demonstração
                        </Button>
                    </div>

                    {/* System Showcase Image */}
                    <div className="mt-24 relative max-w-6xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
                        <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
                        <div className="relative group p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-700">
                            <img
                                src="/assets/landing/hero-showcase.png"
                                alt="Phyr Dashboard Showcase"
                                className="w-full h-auto rounded-2xl shadow-sm transition-transform duration-700 group-hover:scale-[1.01]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-white dark:bg-slate-950/50 relative border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">Como podemos ajudar?</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">Explore as ferramentas integradas do Phyr para impulsionar sua empresa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <div key={idx} className="group p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500">
                                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 scale-110 -rotate-3 group-hover:rotate-0">
                                    <span className="material-symbols-outlined text-[28px]">{feature.icon}</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Escolha o plano ideal para o seu negócio</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Temos planos flexíveis que acompanham o crescimento da sua empresa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan, idx) => (
                            <div key={idx} className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-2xl transition-all duration-500 relative ${plan.highlight ? 'ring-2 ring-primary shadow-2xl shadow-primary/10 md:scale-105 z-10' : ''}`}>
                                {plan.highlight && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                        Mais Popular
                                    </div>
                                )}
                                <div className="mb-8">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{plan.desc}</p>
                                </div>
                                <div className="mb-8">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price !== 'Sob consulta' ? `R$ ${plan.price}` : plan.price}</span>
                                    {plan.price !== 'Sob consulta' && <span className="text-slate-500 dark:text-slate-400 text-base font-bold">/mês</span>}
                                </div>
                                <ul className="space-y-4 mb-10 flex-grow">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium leading-tight">
                                            <span className="material-symbols-outlined text-accent shrink-0 text-lg">check_circle</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={() => navigate('/signup')}
                                    variant={plan.highlight ? 'primary' : 'outline'}
                                    className={`w-full py-5 px-8 rounded-2xl font-black text-lg transition-all ${plan.highlight ? 'bg-primary text-white shadow-xl shadow-primary/25 hover:scale-105' : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50'}`}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTAs Help/WhatsApp */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-primary rounded-[3rem] p-10 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden relative shadow-3xl shadow-primary/30">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full -ml-20 -mb-20"></div>

                        <div className="max-w-xl relative z-10 text-center lg:text-left">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Ainda precisa de ajuda?</h2>
                            <p className="text-emerald-50 text-lg leading-relaxed font-medium">
                                Nossa equipe de suporte está disponível via WhatsApp para resolver qualquer dúvida em tempo real.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5 relative z-10 w-full lg:w-auto">
                            <Link to="/documentation" className="flex items-center justify-center gap-3 bg-white hover:bg-emerald-50 text-primary px-10 py-5 rounded-2xl font-black text-lg shadow-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-64">
                                <span className="material-symbols-outlined">article</span>
                                Ver Documentação
                            </Link>
                            <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 bg-white hover:bg-emerald-50 text-primary px-10 py-5 rounded-2xl font-black text-lg shadow-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-64">
                                <span className="material-symbols-outlined text-emerald-500">forum</span>
                                Suporte via WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <PublicFooter />

        </div>
    );
};

export default Landing;
