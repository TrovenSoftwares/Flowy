import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VersixLogo, WhatsAppIcon } from '../components/BrandedIcons';

const Help: React.FC = () => {
    const navigate = useNavigate();
    const categories = [
        { icon: 'account_balance', title: 'Primeiros Passos', desc: 'Aprenda o básico sobre como configurar sua conta e importar dados.' },
        { icon: 'robot', title: 'Inteligência Artificial', desc: 'Como nossa IA processa seus comprovantes e gera relatórios.' },
        { icon: 'payments', title: 'Pagamentos e Faturas', desc: 'Gerencie sua assinatura, faturas e métodos de pagamento.' },
        { icon: 'security', title: 'Segurança e Privacidade', desc: 'Saiba como protegemos seus dados financeiros.' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-display">
            <header className="bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 py-4 px-6 md:px-10 flex justify-between items-center">
                <div className="flex items-center">
                    <VersixLogo className="h-[40px] w-auto" />
                </div>
                <Link to="/" className="text-sm font-bold text-primary hover:underline">Ir para Dashboard</Link>
            </header>

            <main className="max-w-5xl mx-auto py-16 px-6">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Como podemos ajudar?</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Pesquise em nossa base de conhecimento ou escolha uma categoria abaixo.
                    </p>
                    <div className="mt-8 max-w-xl mx-auto relative text-slate-400 focus-within:text-primary transition-colors">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">search</span>
                        <input
                            type="text"
                            placeholder="Pesquisar por artigos de ajuda..."
                            className="w-full py-4 pl-12 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {categories.map((cat, idx) => (
                        <button key={idx} className="flex items-start gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:shadow-lg transition-all text-left group">
                            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">{cat.icon}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{cat.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{cat.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

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
        </div>
    );
};

export default Help;
