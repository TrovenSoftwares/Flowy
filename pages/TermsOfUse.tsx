import React from 'react';
import { Link } from 'react-router-dom';
import { VersixLogo } from '../components/BrandedIcons';

const TermsOfUse: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-display">
            <header className="bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 py-4 px-6 md:px-10 flex justify-between items-center">
                <div className="flex items-center">
                    <VersixLogo className="h-[40px] w-auto" />
                </div>
                <Link to="/login" className="text-sm font-bold text-primary hover:underline">Voltar ao Login</Link>
            </header>

            <main className="max-w-4xl mx-auto py-12 px-6">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Termos de Uso</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">Última atualização: 08 de Janeiro de 2026</p>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Aceitação dos Termos</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Ao acessar e usar o Versix, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Descrição do Serviço</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            O Versix é um ERP financeiro inteligente que utiliza Inteligência Artificial para automação de processos, integração com WhatsApp e gestão de fluxo de caixa. Reservamo-nos o direito de modificar ou descontinuar o serviço a qualquer momento.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Contas de Usuário</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em aceitar a responsabilidade por todas as atividades que ocorrem em sua conta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Privacidade e Dados</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Seu uso do Versix também é regido por nossa Política de Privacidade. Ao usar o Versix, você consente com a coleta e uso de informações conforme detalhado em nossa política.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Limitação de Responsabilidade</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            O Versix não será responsável por quaisquer danos diretos, indiretos, incidentais ou consequentes resultantes do uso ou da incapacidade de usar nossos serviços.
                        </p>
                    </section>
                </div>

                <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        Dúvidas sobre os termos? Entre em contato com nosso <Link to="/help" className="text-primary font-bold hover:underline">centro de ajuda</Link>.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default TermsOfUse;
