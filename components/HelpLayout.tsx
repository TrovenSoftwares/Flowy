import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

const HelpLayout: React.FC<{ children: React.ReactNode; title: string; category: string }> = ({ children, title, category }) => {
    const [feedbackSent, setFeedbackSent] = React.useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-display transition-all duration-500">
            <PublicHeader
                showBackButton={true}
                backLink="/help"
                backLabel=""
                pageName={title}
            />

            <main className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">{title}</h1>
                    <div className="h-1.5 w-20 bg-primary rounded-full animate-all duration-1000"></div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    {children}
                </div>

                <footer className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    {!feedbackSent ? (
                        <>
                            <p className="text-sm font-medium text-slate-500">Este artigo foi útil?</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setFeedbackSent(true)}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all text-sm font-bold active:scale-90 group"
                                >
                                    <span className="material-symbols-outlined text-green-500 transition-transform group-hover:scale-125 group-hover:rotate-12">thumb_up</span> Sim
                                </button>
                                <button
                                    onClick={() => setFeedbackSent(true)}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5 transition-all text-sm font-bold active:scale-90 group"
                                >
                                    <span className="material-symbols-outlined text-red-500 transition-transform group-hover:scale-125 group-hover:-rotate-12">thumb_down</span> Não
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 py-3 px-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in zoom-in duration-300">
                            <span className="material-symbols-outlined text-primary">check_circle</span>
                            <p className="text-sm font-bold text-primary">Obrigado pelo seu feedback! Isso nos ajuda a melhorar.</p>
                        </div>
                    )}
                </footer>
            </main>

            <PublicFooter />
        </div>
    );
};

export default HelpLayout;
