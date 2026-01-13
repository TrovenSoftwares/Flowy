import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import InputMask from './InputMask';
import CustomSelect from './CustomSelect';
import { MASKS } from '../utils/utils';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transaction: any;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ isOpen, onClose, onSuccess, transaction }) => {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        value: '',
        date: '',
        description: '',
        category_id: '',
        account_id: '',
        contact_id: '',
        status: '',
        type: 'expense' as 'income' | 'expense',
        is_ai: false
    });

    useEffect(() => {
        const fetchOptions = async () => {
            const { data: cats } = await supabase.from('categories').select('*').order('name');
            const { data: accs } = await supabase.from('accounts').select('*').order('name');
            const { data: conts } = await supabase.from('contacts').select('id, name, category').order('name');

            if (cats) {
                const parents = cats.filter(c => !c.parent_id);
                const grouped: any[] = [];
                parents.forEach(p => {
                    grouped.push({ value: p.id, label: p.name, icon: p.icon || 'label' });
                    cats.filter(c => c.parent_id === p.id).forEach(sub => {
                        grouped.push({ value: sub.id, label: `↳ ${sub.name}`, icon: sub.icon || 'subdirectory_arrow_right' });
                    });
                });
                setCategories(grouped);
            }
            if (accs) setAccounts(accs);
            if (conts) setContacts(conts);
        };

        if (isOpen) {
            fetchOptions();
        }
    }, [isOpen]);

    useEffect(() => {
        if (transaction) {
            setFormData({
                value: transaction.value.toString(), // Raw number to string
                date: transaction.date,
                description: transaction.description,
                category_id: transaction.category_id || '',
                account_id: transaction.account_id || '',
                contact_id: transaction.contact_id || '',
                status: transaction.status,
                type: transaction.type,
                is_ai: transaction.is_ai || false
            });
        }
    }, [transaction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // If the user didn't edit the value field (it's still a raw number string), use it directly.
            // If they edited it (it has R$ and formatting), clean it.
            let valueNum = parseFloat(formData.value);
            if (isNaN(valueNum) || formData.value.includes('R$') || formData.value.includes(',')) {
                const cleanValue = formData.value.toString().replace('R$ ', '').replace(/\./g, '').replace(',', '.').trim();
                valueNum = parseFloat(cleanValue);
            }

            const { error } = await supabase
                .from('transactions')
                .update({
                    description: formData.description,
                    value: valueNum,
                    date: formData.date,
                    category_id: formData.category_id,
                    account_id: formData.account_id,
                    contact_id: formData.contact_id || null, // Handle empty string
                    status: formData.status,
                    type: formData.type,
                    is_ai: formData.is_ai
                })
                .eq('id', transaction.id);

            if (error) throw error;

            toast.success('Transação atualizada!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating transaction:', error);
            toast.error('Erro ao atualizar transação.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredContacts = contacts.filter(c => {
        if (formData.type === 'income') return c.category === 'Cliente';
        return c.category === 'Fornecedor' || c.category === 'Funcionário';
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar Transação</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Type Selection */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'income' })}
                                className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold border transition-all ${formData.type === 'income' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span className="material-symbols-outlined">arrow_upward</span>
                                Receita
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                                className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold border transition-all ${formData.type === 'expense' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span className="material-symbols-outlined">arrow_downward</span>
                                Despesa
                            </button>
                        </div>

                        {/* Value & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Valor</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 text-sm">R$</span>
                                    </div>
                                    <InputMask
                                        mask={MASKS.CURRENCY}
                                        className="block w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        value={formData.value} // This will need handling if it's raw number vs masked string
                                        onAccept={(val) => setFormData({ ...formData, value: val })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Data</label>
                                <input
                                    type="date"
                                    className="block w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-primary focus:border-primary outline-none"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descrição</label>
                            <input
                                type="text"
                                className="block w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-primary focus:border-primary outline-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Category & Account */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
                                <CustomSelect
                                    value={formData.category_id}
                                    onChange={(val) => setFormData({ ...formData, category_id: val })}
                                    options={categories}
                                    placeholder="Selecione..."
                                    icon="label"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Conta</label>
                                <CustomSelect
                                    value={formData.account_id}
                                    onChange={(val) => setFormData({ ...formData, account_id: val })}
                                    options={accounts.map(a => ({ value: a.id, label: a.name }))}
                                    placeholder="Selecione..."
                                    icon="account_balance"
                                />
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formData.type === 'income' ? 'Cliente' : 'Fornecedor / Funcionário'}</label>
                            <CustomSelect
                                value={formData.contact_id}
                                onChange={(val) => setFormData({ ...formData, contact_id: val })}
                                options={filteredContacts.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="Sem vínculo"
                                icon="person"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'confirmed' ? 'pending' : 'confirmed' }))}>
                            <input
                                type="checkbox"
                                checked={formData.status === 'confirmed'}
                                readOnly
                                className="w-5 h-5 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Transação Efetivada (Pago/Recebido)
                            </span>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        form="edit-form"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-colors flex items-center gap-2"
                    >
                        {loading ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditTransactionModal;
