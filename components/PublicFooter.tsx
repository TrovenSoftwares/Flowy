import React from 'react';
import { Link } from 'react-router-dom';
import { PhyrLogo } from './BrandedIcons';

const PublicFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-24">
                    <div className="col-span-2 md:col-span-1 space-y-8">
                        <PhyrLogo className="h-10 w-auto" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                            Revolucionando a gestão de pequenas e médias empresas através da inteligência aplicada.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-[0.2em]">Produto</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                            <li><Link to="/" className="hover:text-primary transition-colors">Funcionalidades</Link></li>
                            <li><Link to="/help/whatsapp-ai" className="hover:text-primary transition-colors">IA & Automação</Link></li>
                            <li><Link to="/documentation" className="hover:text-primary transition-colors">API para Devs</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-8">
                        <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-[0.2em]">Suporte</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                            <li><Link to="/help" className="hover:text-primary transition-colors">Central de Ajuda</Link></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Status do Sistema</a></li>
                            <li><a href="mailto:contato@phyr.com.br" className="hover:text-primary transition-colors">Contato</a></li>
                        </ul>
                    </div>

                    <div className="space-y-8">
                        <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-[0.2em]">Legal</h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacidade</Link></li>
                            <li><Link to="/terms" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-slate-400 font-bold text-sm">
                        © {currentYear} Phyr. Todos os direitos reservados. Desenvolvido por Troven Softwares.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-slate-400 hover:text-primary transition-all hover:scale-125">
                            <span className="material-symbols-outlined">public</span>
                        </a>
                        <a href="#" className="text-slate-400 hover:text-primary transition-all hover:scale-125">
                            <span className="material-symbols-outlined">share</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
