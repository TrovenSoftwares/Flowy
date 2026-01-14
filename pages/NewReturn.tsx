import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import InputMask from '../components/InputMask';
import { MASKS, formatCpfCnpj } from '../utils/utils';
import { toast } from 'react-hot-toast';
import { WeightIcon } from '../components/BrandedIcons';

const NewReturn: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [contacts, setContacts] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [reasons, setReasons] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // Moved up
    const [searchContact, setSearchContact] = useState('');
    const [showContactList, setShowContactList] = useState(false);

    const [formData, setFormData] = useState({
        weight: '',
        gram_value: '',
        total_value: '',
        return_date: new Date().toISOString().split('T')[0],
        contact_id: '',
        client_name: '',
        account_id: '',
        reason_id: '',
        use_calculated: true
    });

    const fetchBaseData = useCallback(async () => {
        try {
            const [clientsRes, accountsRes, reasonsRes, categoriesRes] = await Promise.all([
                supabase.from('contacts').select('id, name, phone, email, id_number').order('name'),
                supabase.from('accounts').select('id, name').order('name'),
                supabase.from('return_reasons').select('id, name').order('name'),
                supabase.from('categories').select('id, name').order('name')
            ]);

            setContacts(clientsRes.data || []);
            setAccounts(accountsRes.data || []);
            setReasons(reasonsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching base data:', error);
        }
    }, []);

    const fetchReturn = useCallback(async () => {
        if (!id) return;
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('returns')
                .select('*, contact:contacts(name)')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    weight: data.weight?.toString() || '',
                    gram_value: data.gram_value?.toString() || '',
                    total_value: data.total_value?.toString() || '',
                    return_date: data.return_date,
                    contact_id: data.contact_id || '',
                    client_name: data.contact?.name || '',
                    account_id: data.account_id || '',
                    reason_id: data.reason_id || '',
                    use_calculated: !data.weight || !data.gram_value
                });
            }
        } catch (error) {
            toast.error('Erro ao carregar devolução.');
            navigate('/returns');
        }
        setFetching(false);
    }, [id, navigate]);

    useEffect(() => {
        fetchBaseData();
        if (isEdit) fetchReturn();
    }, [fetchBaseData, fetchReturn, isEdit]);

    // Calcular valor total automaticamente
    useEffect(() => {
        if (formData.use_calculated && formData.weight && formData.gram_value) {
            const weight = parseFloat(formData.weight.replace(',', '.'));
            const gramValue = parseFloat(formData.gram_value.replace(/[^\d,.-]/g, '').replace(',', '.'));
            if (!isNaN(weight) && !isNaN(gramValue)) {
                const total = weight * gramValue;
                setFormData(prev => ({ ...prev, total_value: total.toFixed(2) }));
            }
        }
    }, [formData.weight, formData.gram_value, formData.use_calculated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.total_value || !formData.return_date || !formData.contact_id || !formData.account_id || !formData.reason_id) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const returnData = {
                user_id: user.id,
                weight: formData.weight ? parseFloat(formData.weight.replace(',', '.')) : null,
                gram_value: formData.gram_value ? parseFloat(formData.gram_value.replace(/[^\d,.-]/g, '').replace(',', '.')) : null,
                total_value: parseFloat(formData.total_value.replace(/[^\d,.-]/g, '').replace(',', '.')),
                return_date: formData.return_date,
                contact_id: formData.contact_id,
                account_id: formData.account_id,
                reason_id: formData.reason_id
            };

            let returnId = id;

            if (isEdit) {
                const { error } = await supabase
                    .from('returns')
                    .update(returnData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('returns')
                    .insert(returnData)
                    .select()
                    .single();
                if (error) throw error;
                returnId = data.id;
            }

            // Criar transação vinculada (Entrada com tag de Devolução)
            if (!isEdit) {
                // Find or create 'Devolução' category
                let devolucaoCategory = categories.find(c => c.name === 'Devolução');

                if (!devolucaoCategory) {
                    const { data: newCat, error: catError } = await supabase
                        .from('categories')
                        .insert({
                            user_id: user.id,
                            name: 'Devolução',
                            icon: 'keyboard_return',
                            color: 'bg-emerald-100 text-emerald-600',
                            type: 'income'
                        })
                        .select()
                        .single();

                    if (catError) {
                        console.error('Error creating category:', catError);
                        // Fallback to null or handle error
                    } else {
                        devolucaoCategory = newCat;
                    }
                }

                const reason = reasons.find(r => r.id === formData.reason_id);
                const transactionData = {
                    user_id: user.id,
                    type: 'income', // Requested: Entrada
                    value: returnData.total_value,
                    date: returnData.return_date,
                    description: `Devolução - ${reason?.name || 'Motivo não especificado'}`,
                    account_id: returnData.account_id,
                    contact_id: returnData.contact_id,
                    category_id: devolucaoCategory?.id || null, // Tag de Devolução
                    status: 'confirmed'
                };

                const { data: txData, error: txError } = await supabase
                    .from('transactions')
                    .insert(transactionData)
                    .select()
                    .single();


                if (txError) throw txError;

                // Atualizar devolução com transaction_id
                await supabase
                    .from('returns')
                    .update({ transaction_id: txData.id })
                    .eq('id', returnId);

                // Atualizar saldo do cliente (adicionar crédito)
                const { data: client } = await supabase
                    .from('contacts')
                    .select('balance')
                    .eq('id', returnData.contact_id)
                    .single();

                const currentBalance = client?.balance || 0;
                await supabase
                    .from('contacts')
                    .update({ balance: currentBalance + returnData.total_value })
                    .eq('id', returnData.contact_id);
            }

            toast.success(isEdit ? 'Devolução atualizada!' : 'Devolução registrada com sucesso!');
            navigate('/returns');
        } catch (error: any) {
            console.error('Error saving return:', error);
            toast.error('Erro ao salvar devolução.');
        }
        setLoading(false);
    };

    const selectContact = (contact: any) => {
        setFormData({ ...formData, contact_id: contact.id, client_name: contact.name });
        setSearchContact('');
        setShowContactList(false);
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                Carregando dados da devolução...
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            {/* Header Area */}
            <div className="w-full px-8 py-6 border-b border-[#e7edf3] dark:border-slate-800">
                <div className="max-w-[1000px] mx-auto">
                    <PageHeader
                        title={isEdit ? 'Editar Devolução' : 'Nova Devolução'}
                        description={isEdit ? 'Atualize os dados da devolução abaixo.' : 'Preencha os dados abaixo para registrar uma nova devolução.'}
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/returns')}
                                className="flex items-center justify-center gap-2 h-10 px-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                <span>Voltar</span>
                            </button>
                        }
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full p-8">
                <div className="max-w-[1000px] mx-auto h-full flex flex-col gap-6 items-start">
                    <div className="w-full flex flex-col gap-4">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-slate-900 dark:text-white tracking-tight text-[20px] font-bold leading-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">assignment_return</span>
                                Dados da Devolução
                            </h2>
                        </div>

                        <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm p-6 flex flex-col gap-8 w-full">
                            {/* Client Selection */}
                            <div className="flex flex-col gap-2 relative">
                                <label className="text-slate-900 dark:text-white text-sm font-medium flex gap-1">
                                    Cliente <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center bg-[#f1f5f9] dark:bg-slate-900 rounded-lg h-12 px-4 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all border border-transparent group">
                                    <span className="material-symbols-outlined text-slate-400 mr-2 group-focus-within:text-primary transition-colors">person_search</span>
                                    <input
                                        className="bg-transparent border-none w-full text-slate-900 dark:text-white font-medium text-base focus:ring-0 p-0 placeholder:text-slate-400"
                                        placeholder={formData.client_name || "Buscar cliente por nome..."}
                                        type="text"
                                        value={searchContact}
                                        onChange={(e) => {
                                            setSearchContact(e.target.value);
                                            setShowContactList(true);
                                        }}
                                        onFocus={() => setShowContactList(true)}
                                    />
                                    <Link to="/contacts/new" className="text-primary text-sm font-bold hover:underline whitespace-nowrap ml-2">Novo Cliente</Link>
                                </div>

                                {showContactList && searchContact.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                        {contacts.filter(c => c.name.toLowerCase().includes(searchContact.toLowerCase())).map(contact => (
                                            <div
                                                key={contact.id}
                                                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm"
                                                onClick={() => selectContact(contact)}
                                            >
                                                <p className="font-bold text-slate-900 dark:text-white">{contact.name}</p>
                                                <p className="text-xs text-slate-500">{contact.phone || contact.email || formatCpfCnpj(contact.id_number)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                            {/* Form Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Data da Devolução */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-900 dark:text-white text-sm font-medium flex gap-1">
                                        Data da Devolução <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center bg-[#f1f5f9] dark:bg-slate-900 rounded-lg h-12 px-4 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all border border-transparent">
                                        <input
                                            className="bg-transparent border-none w-full text-slate-900 dark:text-white font-medium text-base focus:ring-0 p-0"
                                            type="date"
                                            required
                                            value={formData.return_date}
                                            onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Motivo */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-900 dark:text-white text-sm font-medium flex gap-1">
                                        Motivo <span className="text-red-500">*</span>
                                    </label>
                                    <CustomSelect
                                        value={formData.reason_id}
                                        onChange={(val) => setFormData({ ...formData, reason_id: val })}
                                        placeholder="Selecione o motivo"
                                        icon="label"
                                        options={reasons.map(r => ({ value: r.id, label: r.name }))}
                                    />
                                    {reasons.length === 0 && (
                                        <p className="text-xs text-amber-500">Nenhum motivo cadastrado. <Link to="/returns/reasons" className="underline">Cadastre aqui</Link>.</p>
                                    )}
                                </div>

                                {/* Conta Bancária */}
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-slate-900 dark:text-white text-sm font-medium flex gap-1">
                                        Conta Bancária <span className="text-red-500">*</span>
                                    </label>
                                    <CustomSelect
                                        value={formData.account_id}
                                        onChange={(val) => setFormData({ ...formData, account_id: val })}
                                        placeholder="Selecione a conta"
                                        icon="account_balance"
                                        options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                            {/* Cálculo do Valor */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg text-primary">payments</span>
                                        Cálculo do Valor
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.use_calculated}
                                            onChange={(e) => setFormData({ ...formData, use_calculated: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Calcular automaticamente</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Peso */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-900 dark:text-white text-sm font-medium">
                                            Peso (gramas)
                                        </label>
                                        <div className="flex items-center bg-[#f1f5f9] dark:bg-slate-900 rounded-lg h-12 px-4 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white dark:focus-within:bg-slate-950 transition-all border border-transparent">
                                            <WeightIcon className="size-5 text-slate-400 mr-2" />
                                            <input
                                                className="bg-transparent border-none w-full text-slate-900 dark:text-white font-bold text-lg focus:ring-0 p-0"
                                                placeholder="0"
                                                type="text"
                                                value={formData.weight}
                                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                disabled={!formData.use_calculated}
                                            />
                                            <span className="text-slate-400 font-bold ml-2">g</span>
                                        </div>
                                    </div>

                                    {/* Valor por grama */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-900 dark:text-white text-sm font-medium">
                                            Valor por Grama (R$)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold z-10">R$</span>
                                            <InputMask
                                                mask={MASKS.CURRENCY}
                                                value={formData.gram_value}
                                                onAccept={(val) => setFormData({ ...formData, gram_value: val })}
                                                placeholder="0,00"
                                                className="pl-12 font-bold text-lg"
                                                disabled={!formData.use_calculated}
                                            />
                                        </div>
                                    </div>

                                    {/* Valor Total */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-900 dark:text-white text-sm font-medium flex gap-1">
                                            Valor Total (R$) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold z-10">R$</span>
                                            <InputMask
                                                mask={MASKS.CURRENCY}
                                                value={formData.total_value}
                                                onAccept={(val) => setFormData({ ...formData, total_value: val })}
                                                placeholder="0,00"
                                                className={`pl-12 font-bold text-lg ${formData.use_calculated ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                                                disabled={formData.use_calculated}
                                            />
                                        </div>
                                        {formData.use_calculated && (
                                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">calculate</span>
                                                Calculado automaticamente
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form Footer Actions */}
                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-end items-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/returns')}
                                    className="h-12 px-6 rounded-lg border border-[#e7edf3] dark:border-slate-700 text-slate-500 dark:text-slate-300 font-bold bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 dark:shadow-none transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">save</span>
                                            {isEdit ? 'Salvar Alterações' : 'Cadastrar Devolução'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default NewReturn;
