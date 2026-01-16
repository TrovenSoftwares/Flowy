import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import { extractFinancialDataWithAI } from '../lib/groq';
import { toast } from 'react-hot-toast';

interface ImportReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: any[];
    categories: any[];
    accounts: any[];
    onConfirm: (finalData: any[]) => void;
    submitting: boolean;
}

const ImportReviewModal: React.FC<ImportReviewModalProps> = ({
    isOpen, onClose, transactions: initialTransactions, categories, accounts, onConfirm, submitting
}) => {
    const [items, setItems] = useState<any[]>([]);
    const [aiProcessingId, setAiProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setItems(initialTransactions.map(t => ({
                ...t,
                category_id: '',
                account_id: accounts[0]?.id || '',
                description: t.memo,
                type: t.amount >= 0 ? 'income' : 'expense',
                value: Math.abs(t.amount).toString().replace('.', ','),
                date: t.date,
                suggested_category: ''
            })));
        }
    }, [isOpen, initialTransactions, accounts]);

    const handleUpdate = (id: string, field: string, value: any) => {
        setItems(prev => prev.map(item => item.fitid === id ? { ...item, [field]: value } : item));
    };

    const handleAiRefine = async (item: any) => {
        setAiProcessingId(item.fitid);
        try {
            // Using environment variable for security
            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            const refined = await extractFinancialDataWithAI(apiKey, `Transação Bancária: ${item.memo}`, categories, accounts, []);

            if (refined) {
                handleUpdate(item.fitid, 'category_id', refined.category_id || '');
                handleUpdate(item.fitid, 'suggested_category', refined.suggested_category || '');
                if (refined.description) handleUpdate(item.fitid, 'description', refined.description);
            }
        } catch (error) {
            console.error('AI Refine error:', error);
            toast.error('Erro ao consultar IA para esta transação.');
        } finally {
            setAiProcessingId(null);
        }
    };

    const handleApplyAiToAll = async () => {
        toast.loading('Iniciando análise inteligente de todas as transações...', { id: 'ai-all' });
        for (const item of items) {
            if (!item.category_id) {
                await handleAiRefine(item);
            }
        }
        toast.success('Análise concluída!', { id: 'ai-all' });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Revisar Importação Bancária"
            width="max-w-4xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <button
                        onClick={handleApplyAiToAll}
                        disabled={aiProcessingId !== null || submitting}
                        className="flex items-center gap-2 text-primary font-bold text-sm hover:underline disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Classificar todos com IA
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                        <button
                            onClick={() => onConfirm(items)}
                            disabled={submitting || aiProcessingId !== null}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50"
                        >
                            {submitting ? 'Salvando...' : `Confirmar ${items.length} Lançamentos`}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, idx) => (
                    <div key={item.fitid} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3 relative group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {item.type === 'income' ? 'Entrada' : 'Saída'}
                                </span>
                                <span className="text-xs font-bold text-slate-400">ID: {item.fitid}</span>
                            </div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">R$ {item.value}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Descrição (Memo do Banco)</label>
                                <input
                                    className="w-full text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg"
                                    value={item.description}
                                    onChange={(e) => handleUpdate(item.fitid, 'description', e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase">Categoria</label>
                                    {!item.category_id && item.suggested_category && (
                                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">lightbulb</span>
                                            Sugestão: {item.suggested_category}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <CustomSelect
                                            value={item.category_id}
                                            onChange={(val) => handleUpdate(item.fitid, 'category_id', val)}
                                            options={categories}
                                            placeholder="Selecionar..."
                                            className="!h-9"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleAiRefine(item)}
                                        disabled={aiProcessingId === item.fitid}
                                        className="size-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                                    >
                                        <span className={`material-symbols-outlined ${aiProcessingId === item.fitid ? 'animate-spin' : ''}`}>auto_awesome</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default ImportReviewModal;
