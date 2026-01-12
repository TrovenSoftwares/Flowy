import React from 'react';
import { Link } from 'react-router-dom';
import { VersixLogo } from '../components/BrandedIcons';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-display">
            <header className="bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 py-4 px-6 md:px-10 flex justify-between items-center">
                <div className="flex items-center">
                    <VersixLogo className="h-[40px] w-auto" />
                </div>
                <Link to="/login" className="text-sm font-bold text-primary hover:underline">Voltar ao Login</Link>
            </header>

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
                            <li>Fornecer e manter os serviços do Versix;</li>
                            <li>Processar transações e enviar notificações;</li>
                            <li>Personalizar sua experiência com Inteligência Artificial;</li>
                            <li>Melhorar nossa segurança e prevenir fraudes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Integração com WhatsApp</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Ao utilizar a integração com WhatsApp, o Versix processa apenas as mensagens e mídias que você envia para o nosso número dedicado. Essas informações são criptografadas e utilizadas exclusivamente para alimentar seu painel financeiro.
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
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
