import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { WhatsAppIcon } from '../components/BrandedIcons'; // Note: check path if needed, usually in components

const Help: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const categories = [
        {
            icon: 'rocket_launch',
            title: 'Primeiros Passos',
            desc: 'Configuração inicial e conceitos básicos do zero.',
            route: '/help/getting-started'
        },
        {
            icon: 'account_balance',
            title: 'Gestão Financeira',
            desc: 'Fluxo de Caixa, PDV e relatórios profissionais.',
            route: '/help/financial'
        },
        {
            icon: 'psychology',
            title: 'WhatsApp & IA',
            desc: 'Conectando instâncias e Revisão Inteligente.',
            route: '/help/whatsapp-ai'
        },
        {
            icon: 'security',
            title: 'Segurança',
            desc: 'Como mantemos seus dados financeiros protegidos.',
            route: '/help/security'
        }
    ];

    const filteredCategories = categories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-display transition-all duration-500">
            <PublicHeader />

            <main className="max-w-5xl mx-auto py-16 px-6">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Como podemos ajudar?</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Pesquise em nossa base de conhecimento ou escolha uma categoria abaixo.
                    </p>
                    <div className="mt-8 max-w-xl mx-auto relative text-slate-400 focus-within:text-primary transition-all duration-300">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Pesquisar por artigos de ajuda..."
                            className="w-full py-4 pl-12 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white transition-all shadow-primary/5 focus:shadow-primary/10"
                        />
                    </div>
                </div>

                {filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 animate-in fade-in duration-700">
                        {filteredCategories.map((cat, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(cat.route)}
                                className="flex items-start gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all text-left group active:scale-95"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined transition-transform group-hover:scale-110">{cat.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{cat.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{cat.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <span className="material-symbols-outlined text-4xl">search_off</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum resultado encontrado</h3>
                        <p className="text-slate-500">Tente usar palavras-chave diferentes.</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-6 text-primary font-bold hover:underline"
                        >
                            Limpar busca
                        </button>
                    </div>
                )}

                <div className="bg-primary rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ainda precisa de ajuda?</h2>
                        <p className="text-primary-foreground/80 max-w-md">
                            Nossa equipe de suporte está disponível via WhatsApp para resolver qualquer dúvida em tempo real.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/documentation')}
                        className="flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors shadow-xl"
                    >
                        <span className="material-symbols-outlined">description</span>
                        Ver Documentação Completa
                    </button>
                    <button className="flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors shadow-xl">
                        <WhatsAppIcon className="size-6" />
                        Suporte via WhatsApp
                    </button>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default Help;
