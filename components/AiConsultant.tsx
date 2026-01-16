import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { extractFinancialDataWithAI } from '../lib/groq'; // Reusing AI infrastructure

interface AiConsultantProps {
    apiKey?: string;
}

const AiConsultant: React.FC<AiConsultantProps> = ({ apiKey }) => {
    const [insight, setInsight] = useState<string>('Analisando suas finanças...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatsAndGenerateInsight();
    }, []);

    const fetchStatsAndGenerateInsight = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            // Fetch this month's transactions
            const { data: transactions } = await supabase
                .from('transactions')
                .select('value, type, category_id, date')
                .gte('date', firstDayOfMonth)
                .lte('date', lastDayOfMonth);

            if (!transactions || transactions.length === 0) {
                setInsight('Ainda não tenho dados suficientes para este mês. Comece a registrar suas transações!');
                setLoading(false);
                return;
            }

            const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.value || 0), 0);
            const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.value || 0), 0);

            // Basic AI Prompt for insight
            const prompt = `
        Aja como um consultor financeiro sênior. Aqui estão os dados deste mês:
        - Receita Total: R$ ${totalIncome.toFixed(2)}
        - Despesa Total: R$ ${totalExpense.toFixed(2)}
        - Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}
        
        Gere um insight curto (máximo 2 frases), direto e motivador. 
        Se o saldo for positivo, elogie. Se for negativo ou muito apertado, dê um conselho prático.
        Seja humano e use uma linguagem amigável mas profissional em Português Brasileiro.
      `;

            // Simulating AI call using our Groq/AI fallback lib (or a specialized function)
            // For now, let's use a simplified version of the extract call if possible, or just a fetch
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 150
                })
            });

            const data = await response.json();
            const aiText = data.choices?.[0]?.message?.content || 'Continue cuidando das suas finanças!';
            setInsight(aiText);

        } catch (error) {
            console.error('Error generating insight:', error);
            setInsight('Não consegui analisar seus dados agora, mas continue registrando!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-px shadow-lg group">
            <div className="relative h-full rounded-[23px] bg-white dark:bg-slate-900 p-5 transition-all hover:bg-opacity-90">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined animate-bounce">robot_2</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Consultor Flowy AI</h3>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Insights Automáticos</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStatsAndGenerateInsight}
                        disabled={loading}
                        className="size-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
                    </button>
                </div>

                <div className="relative min-h-[60px]">
                    {loading ? (
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                            <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse delay-75"></div>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic font-medium">
                            "{insight}"
                        </p>
                    )}
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            </div>
        </div>
    );
};

export default AiConsultant;
