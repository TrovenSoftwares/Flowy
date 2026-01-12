import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import InputMask from '../components/InputMask';
import { MASKS } from '../utils/utils';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

const NewSeller: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        balance: '0' // Could represent Commission to Pay or Debt
    });

    useEffect(() => {
        const fetchSeller = async () => {
            if (isEdit) {
                const { data, error } = await supabase
                    .from('contacts')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (data) {
                    setFormData({
                        name: data.name,
                        phone: data.phone ? (data.phone.startsWith('55') && data.phone.length > 11 ? data.phone.substring(2) : data.phone) : '',
                        email: data.email || '',
                        balance: data.balance.toString()
                    });
                }
                setFetching(false);
            }
        };

        fetchSeller();
    }, [id, isEdit]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Fetch User ID first to ensure it is resolved
        const { data: { user } } = await supabase.auth.getUser();

        const payload = {
            name: formData.name,
            id_number: null, // Explicitly set to null to avoid missing column errors if strict
            category: 'Vendedor',
            phone: formData.phone ? (formData.phone.replace(/\D/g, '').length <= 11 ? `55${formData.phone.replace(/\D/g, '')}` : formData.phone.replace(/\D/g, '')) : null,
            email: formData.email || null,
            balance: parseFloat(formData.balance.replace(',', '.') || '0'),
            user_id: user?.id
        };

        let result;
        if (isEdit) {
            result = await supabase.from('contacts').update(payload).eq('id', id);
        } else {
            result = await supabase.from('contacts').insert([payload]);
        }

        if (result.error) {
            toast.error('Erro ao salvar vendedor: ' + result.error.message);
        } else {
            toast.success(isEdit ? 'Vendedor atualizado com sucesso!' : 'Vendedor cadastrado com sucesso!');
            navigate('/sellers');
        }
        setLoading(false);
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                Carregando dados do vendedor...
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            <div className="w-full px-8 py-6 border-b border-[#e7edf3] dark:border-slate-800">
                <div className="max-w-5xl mx-auto">
                    <PageHeader
                        title={isEdit ? 'Editar Vendedor' : 'Novo Vendedor'}
                        description={isEdit ? 'Atualize os dados do vendedor.' : 'Cadastre um novo vendedor na sua equipe.'}
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/sellers')}
                                className="flex items-center justify-center gap-2 h-10 px-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                <span>Voltar</span>
                            </button>
                        }
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20">
                    <form className="flex flex-col gap-6" onSubmit={handleSave}>
                        <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 flex-wrap gap-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">badge</span>
                                    Dados do Vendedor
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">Nome do Vendedor</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                                        </div>
                                        <input
                                            className="w-full pl-10 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm py-2.5 outline-none transition-all"
                                            placeholder="Nome completo..."
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Removed CPF/CNPJ as it might be less critical for Sellers or handled internally. User asked for separation. Keeping it simple. */}

                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">Telefone / WhatsApp</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <span className="material-symbols-outlined text-slate-400 text-[18px]">call</span>
                                        </div>
                                        <InputMask
                                            mask={MASKS.PHONE}
                                            value={formData.phone}
                                            onAccept={(val) => setFormData({ ...formData, phone: val })}
                                            placeholder="(00) 00000-0000"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">E-mail</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                                        </div>
                                        <input
                                            className="w-full pl-10 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm py-2.5 outline-none"
                                            placeholder="email@exemplo.com"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">Comissão a Pagar / Saldo (R$)</label>
                                    <InputMask
                                        mask={MASKS.CURRENCY}
                                        value={formData.balance}
                                        onAccept={(val) => setFormData({ ...formData, balance: val })}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row justify-end gap-4 mt-2">
                            <button
                                onClick={() => navigate('/sellers')}
                                className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={loading}
                                className="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                type="submit"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">save</span>
                                        {isEdit ? 'Salvar Alterações' : 'Salvar Vendedor'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewSeller;
