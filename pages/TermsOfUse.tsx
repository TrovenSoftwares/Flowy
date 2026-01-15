import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const TermsOfUse: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-display transition-all duration-500">
            <PublicHeader
                showBackButton={true}
                backLink="/login"
                backLabel="Voltar ao Login"
                pageName="Termos de Uso"
                showHelpBreadcrumb={false}
            />

            <main className="max-w-4xl mx-auto py-12 px-6">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Termos de Uso</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">Última atualização: 08 de Janeiro de 2026</p>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Aceitação dos Termos</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Ao acessar e usar o Phyr, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Descrição do Serviço</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            O Phyr é uma plataforma de gestão financeira inteligente que oferece ferramentas de fluxo de caixa, Ponto de Venda (PDV), emissão de relatórios, gestão de contatos e automação via Inteligência Artificial integrada ao WhatsApp. O serviço é fornecido 'como está' e pode ser atualizado para melhorias contínuas.
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
                            Seu uso do Phyr também é regido por nossa Política de Privacidade. Ao usar o Phyr, você consente com a coleta e uso de informações conforme detalhado em nossa política.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Limitação de Responsabilidade</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            O Phyr não será responsável por quaisquer danos diretos, indiretos, incidentais ou consequentes resultantes do uso ou da incapacidade de usar nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">6. Propriedade Intelectual</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Todo o conteúdo, design, logotipos e software da plataforma Phyr são de propriedade exclusiva e protegidos por leis de propriedade intelectual. O uso da plataforma não concede ao usuário qualquer direito de propriedade sobre o sistema.
                        </p>
                    </section>
                </div>

                <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                        Dúvidas sobre os termos? Entre em contato com nosso <Link to="/help" className="text-primary font-bold hover:underline">centro de ajuda</Link>.
                    </p>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default TermsOfUse;
