import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-display transition-all duration-500">
            <PublicHeader
                showBackButton={true}
                backLink="/login"
                backLabel="Voltar ao Login"
                pageName="Privacidade"
                showHelpBreadcrumb={false}
            />

            <main className="max-w-4xl mx-auto py-12 px-6">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Política de Privacidade</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">Última atualização: 08 de Janeiro de 2026</p>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Coleta de Informações</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Coletamos informações que você nos fornece diretamente, como nome, e-mail e dados financeiros necessários para o funcionamento do ERP. Também coletamos dados técnicos automaticamente quando você usa nossa plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Uso dos Dados</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Seus dados são utilizados para:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                            <li>Fornecer e manter os serviços do Phyr;</li>
                            <li>Processar transações e enviar notificações;</li>
                            <li>Personalizar sua experiência com Inteligência Artificial;</li>
                            <li>Melhorar nossa segurança e prevenir fraudes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Integração com WhatsApp</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            O Phyr permite que você conecte sua própria instância de WhatsApp via API dedicada. O sistema processa apenas as mensagens e mídias das conversas que você selecionar para monitoramento ou que forem enviadas para processamento de comprovantes. Essas informações são utilizadas exclusivamente para extração de dados financeiros por Inteligência Artificial e alimentação do seu painel.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Compartilhamento de Dados</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Não vendemos suas informações pessoais. Podemos compartilhar dados com parceiros confiáveis (como provedores de nuvem e serviços de pagamento) apenas conforme necessário para a execução do serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Seus Direitos (LGPD)</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            De acordo com a Lei Geral de Proteção de Dados, você tem o direito de acessar, corrigir, excluir ou portar seus dados pessoais. Para exercer esses direitos, entre em contato através do nosso suporte.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">6. Retenção e Exclusão de Dados</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Seus dados são armazenados de forma segura enquanto sua conta estiver ativa. Você pode solicitar a exclusão definitiva de todos os seus dados e de sua conta a qualquer momento através das configurações do sistema ou entrando em contato com nosso suporte.
                        </p>
                    </section>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};

export default PrivacyPolicy;
