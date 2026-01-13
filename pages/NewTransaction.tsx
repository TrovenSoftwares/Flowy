import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import InputMask from '../components/InputMask';
import CustomSelect from '../components/CustomSelect';
import { MASKS } from '../utils/utils';

const NewTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'income' | 'expense' | 'transfer'>('expense');
  // Keep internal type for single transactions, but logic will use transactionMode
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    value: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    account_id: '',
    destination_account_id: '', // Added for transfer
    contact_id: '',
    status: 'confirmed'
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      const { data: accs } = await supabase.from('accounts').select('*').order('name');
      const { data: conts } = await supabase.from('contacts').select('id, name, category, phone').order('name');

      if (cats) {
        // Group categories for the select
        const parents = cats.filter(c => !c.parent_id);
        const groupedCats: any[] = [];
        parents.forEach(p => {
          groupedCats.push({ value: p.id, label: p.name, icon: p.icon || 'label' });
          cats.filter(c => c.parent_id === p.id).forEach(sub => {
            groupedCats.push({ value: sub.id, label: `↳ ${sub.name}`, icon: sub.icon || 'subdirectory_arrow_right' });
          });
        });
        setCategories(groupedCats);
      }
      if (accs) setAccounts(accs);
      if (conts) setContacts(conts);
    };
    fetchData();
  }, []);

  // Auto-set type to 'income' if category is 'Venda' (Only if not transfer)
  useEffect(() => {
    if (transactionMode !== 'transfer' && formData.category_id) {
      const selectedCat = categories.find(c => c.value === formData.category_id);
      if (selectedCat && selectedCat.label.toLowerCase().includes('venda')) {
        setTransactionMode('income');
      }
    }
  }, [formData.category_id, categories, transactionMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      toast.success('Arquivo anexado!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.value || !formData.description || !formData.account_id) {
      toast.error('Por favor, preencha os campos obrigatórios (Valor, Descrição, Conta).');
      return;
    }

    if (transactionMode === 'transfer') {
      if (!formData.destination_account_id) {
        toast.error('Selecione a conta de destino para a transferência.');
        return;
      }
      if (formData.account_id === formData.destination_account_id) {
        toast.error('A conta de origem e destino devem ser diferentes.');
        return;
      }
    } else {
      // Normal transaction category check
      if (!formData.category_id) {
        toast.error('Selecione uma categoria.');
        return;
      }
    }

    setLoading(true);
    try {
      const cleanValue = formData.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.').trim();
      const valueNum = parseFloat(cleanValue);
      const user = (await supabase.auth.getUser()).data.user;

      if (transactionMode === 'transfer') {
        const originAccountName = accounts.find(a => a.id === formData.account_id)?.name;
        const destAccountName = accounts.find(a => a.id === formData.destination_account_id)?.name;

        // 1. Create Expense (Origin)
        const expensePayload = {
          description: `Transferência PARA: ${destAccountName} - ${formData.description}`,
          value: valueNum,
          type: 'expense',
          date: formData.date,
          category_id: formData.category_id || null, // Optional for transfer? Or should we block? Assume optional for now or user picks "Transfer" cat
          account_id: formData.account_id,
          status: formData.status,
          user_id: user?.id
        };

        // 2. Create Income (Destination)
        const incomePayload = {
          description: `Transferência DE: ${originAccountName} - ${formData.description}`,
          value: valueNum,
          type: 'income',
          date: formData.date,
          category_id: formData.category_id || null,
          account_id: formData.destination_account_id,
          status: formData.status, // Same status? Usually yes.
          user_id: user?.id
        };

        const { error: error1 } = await supabase.from('transactions').insert(expensePayload);
        if (error1) throw error1;

        const { error: error2 } = await supabase.from('transactions').insert(incomePayload);
        if (error2) throw error2;

        toast.success(`Transferência de R$ ${cleanValue} realizada com sucesso!`);
      } else {
        // Normal Transaction
        const payload: any = {
          description: formData.description,
          value: valueNum,
          type: transactionMode,
          date: formData.date,
          category_id: formData.category_id,
          account_id: formData.account_id,
          status: formData.status,
          user_id: user?.id
        };

        if (formData.contact_id) {
          payload.contact_id = formData.contact_id;
        }

        const { error } = await supabase.from('transactions').insert(payload);
        if (error) throw error;
        toast.success('Transação registrada com sucesso!');
      }

      navigate('/transactions');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    if (transactionMode === 'income') return c.category === 'Cliente' || !c.category;
    return c.category === 'Fornecedor' || c.category === 'Funcionário' || !c.category;
  });

  return (
    <div className="max-w-[1000px] w-full mx-auto p-4 md:p-8 lg:p-12 pb-24 pt-4 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Nova Transação</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Preencha os dados abaixo para registrar uma movimentação.</p>
        </div>
        <div className="flex gap-3">
          <button className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Importar XML
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Segmented Control (Transaction Type) */}
        <div className="border-b border-slate-100 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950/50">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/50 dark:bg-slate-800 rounded-lg max-w-lg mx-auto md:mx-0">
            <label className="cursor-pointer">
              <input
                className="peer sr-only"
                name="transaction_type"
                type="radio"
                value="income"
                checked={transactionMode === 'income'}
                onChange={() => setTransactionMode('income')}
              />
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all duration-200 text-slate-600 dark:text-slate-400 font-medium peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-emerald-600 dark:peer-checked:text-emerald-400 peer-checked:shadow-sm text-sm sm:text-base">
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                <span>Receita</span>
              </div>
            </label>
            <label className="cursor-pointer">
              <input
                className="peer sr-only"
                name="transaction_type"
                type="radio"
                value="expense"
                checked={transactionMode === 'expense'}
                onChange={() => setTransactionMode('expense')}
              />
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all duration-200 text-slate-600 dark:text-slate-400 font-medium peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-red-600 dark:peer-checked:text-red-400 peer-checked:shadow-sm text-sm sm:text-base">
                <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                <span>Despesa</span>
              </div>
            </label>
            <label className="cursor-pointer">
              <input
                className="peer sr-only"
                name="transaction_type"
                type="radio"
                value="transfer"
                checked={transactionMode === 'transfer'}
                onChange={() => setTransactionMode('transfer')}
              />
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all duration-200 text-slate-600 dark:text-slate-400 font-medium peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-blue-600 dark:peer-checked:text-blue-400 peer-checked:shadow-sm text-sm sm:text-base">
                <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                <span>Transferência</span>
              </div>
            </label>
          </div>
        </div>

        <form className="p-6 md:p-8 space-y-8" onSubmit={handleSubmit}>
          {/* Value and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Valor da Transação</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-medium text-lg">R$</span>
                </div>
                <InputMask
                  mask={MASKS.CURRENCY}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-3xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="0,00"
                  value={formData.value}
                  onAccept={(val) => setFormData({ ...formData, value: val })}
                />
              </div>
            </div>
            <div className="md:col-span-5 space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data {transactionMode === 'transfer' ? 'da Transferência' : 'de Pagamento'}</label>
              <div className="relative">
                <input
                  className="block w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-base text-slate-900 dark:text-white focus:ring-primary focus:border-primary outline-none"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Description & Optional Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`space-y-2 ${transactionMode === 'transfer' || transactionMode === 'expense' ? 'md:col-span-2' : ''}`}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
              <input
                className="block w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-base text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder:text-slate-400 outline-none transition-all"
                placeholder={transactionMode === 'transfer' ? 'Ex: Transferência para Poupança' : 'Ex: Venda de Produto X'}
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            {transactionMode === 'income' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
                <CustomSelect
                  value={formData.contact_id}
                  onChange={(val) => setFormData({ ...formData, contact_id: val })}
                  placeholder="Selecione o cliente (opcional)"
                  icon="person"
                  options={contacts.filter(c => c.category === 'Cliente').map(c => ({ value: c.id, label: c.name }))}
                />
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Accounts & Category Logic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Account Selection */}
            {transactionMode === 'transfer' ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">arrow_upward</span>
                    Conta de Origem (Sai dinheiro)
                  </label>
                  <CustomSelect
                    value={formData.account_id}
                    onChange={(val) => setFormData({ ...formData, account_id: val })}
                    placeholder="Selecione a conta de origem"
                    icon="account_balance"
                    options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">arrow_downward</span>
                    Conta de Destino (Entra dinheiro)
                  </label>
                  <CustomSelect
                    value={formData.destination_account_id}
                    onChange={(val) => setFormData({ ...formData, destination_account_id: val })}
                    placeholder="Selecione a conta de destino"
                    icon="account_balance"
                    options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                  <CustomSelect
                    value={formData.category_id}
                    onChange={(val) => setFormData({ ...formData, category_id: val })}
                    placeholder="Selecione uma categoria"
                    icon="label"
                    options={categories}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Conta Bancária / Cartão</label>
                  <CustomSelect
                    value={formData.account_id}
                    onChange={(val) => setFormData({ ...formData, account_id: val })}
                    placeholder="Selecione a conta"
                    icon="account_balance"
                    options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                  />
                </div>
              </>
            )}

          </div>

          {/* Recurring & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, status: formData.status === 'confirmed' ? 'pending' : 'confirmed' })}>
              <div className="flex items-center h-5 pointer-events-none">
                <input
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary bg-white dark:bg-slate-700 dark:border-slate-600"
                  type="checkbox"
                  checked={formData.status === 'confirmed'}
                  readOnly
                />
              </div>
              <div className="flex flex-col select-none">
                <span className="font-medium text-slate-900 dark:text-white">Pago / Realizado</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Marque se a transação já foi efetivada.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer opacity-50 relative overflow-hidden" title="Em breve">
              {/* Coming soon badge */}
              <div className="absolute top-2 right-2 bg-slate-200 dark:bg-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-500">EM BREVE</div>
              <div className="flex items-center h-5 pointer-events-none">
                <input className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary bg-white dark:bg-slate-700 dark:border-slate-600" type="checkbox" disabled />
              </div>
              <div className="flex flex-col select-none">
                <span className="font-medium text-slate-900 dark:text-white">Repetir transação</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Mensalmente, semanalmente...</span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Anexos / Comprovantes</label>
            <div className={`mt-1 flex justify-center rounded-lg border-2 border-dashed ${previewUrl ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700'} px-6 py-10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group relative overflow-hidden`}>
              <input
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                type="file"
                onChange={handleFileChange}
                accept="image/*,application/pdf"
              />
              <div className="text-center relative z-0">
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    {file?.type.includes('image') ? (
                      <img src={previewUrl} className="h-32 object-contain rounded-lg shadow-sm border border-slate-200" alt="Preview" />
                    ) : (
                      <span className="material-symbols-outlined text-6xl text-red-500">picture_as_pdf</span>
                    )}
                    <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">{file?.name}</p>
                    <p className="text-xs text-slate-500">Clique para alterar</p>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined mx-auto text-slate-400 group-hover:text-primary transition-colors text-5xl mb-3">cloud_upload</span>
                    <div className="mt-2 flex text-sm leading-6 text-slate-600 dark:text-slate-400 justify-center">
                      <span className="font-semibold text-primary">Clique para enviar</span>
                      <span className="pl-1">ou arraste e solte</span>
                    </div>
                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-500">PDF, PNG, JPG até 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 dark:bg-slate-950/30 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 rounded-b-xl">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all font-bold"
              type="button"
            >
              Cancelar
            </button>
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">check</span>
              )}
              {loading ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransaction;
