import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import { parseOfx } from '../lib/ofxParser';
import ImportReviewModal from '../components/ImportReviewModal';
import Button from '../components/Button';
import AccountCard from '../components/AccountCard';
import CategoryItem from '../components/CategoryItem';
import Card from '../components/Card';
import { parseCurrency } from '../utils/utils';

const Wallet: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  // Modal States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Editing States
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Deleting States
  const [deleteItem, setDeleteItem] = useState<{ id: string, type: 'account' | 'category' } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Account Form
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'Conta Corrente',
    balance: '0,00', // STARTING WITH 0
    color: 'bg-slate-500',
    icon: '/img/banks/outro.svg'
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    budget: '',
    budget_is_unlimited: false,
    icon: 'label',
    color: 'bg-slate-100 text-slate-600',
    parent_id: ''
  });

  // Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Accounts
      const { data: accs, error: accsError } = await supabase.from('accounts').select('*').order('name');
      if (accsError) throw accsError;

      // 2. Fetch all confirmed transactions to calculate current balance
      const { data: allTransactions, error: transAllError } = await supabase
        .from('transactions')
        .select('account_id, value, type, status');

      if (transAllError) throw transAllError;

      const accsWithBalance = accs?.map(acc => {
        const confirmedTrans = allTransactions?.filter(t => t.account_id === acc.id && t.status === 'confirmed') || [];
        const totalConfirmed = confirmedTrans.reduce((sum, t) => {
          return t.type === 'income' ? sum + Number(t.value) : sum - Number(t.value);
        }, 0);

        return {
          ...acc,
          currentBalance: Number(acc.balance) + totalConfirmed
        };
      }) || [];

      setAccounts(accsWithBalance);

      const total = accsWithBalance.reduce((acc, a) => acc + a.currentBalance, 0);
      setTotalBalance(total);

      // 3. Fetch Categories and their spending
      const { data: cats, error: catsError } = await supabase.from('categories').select('*').order('name');
      if (catsError) throw catsError;

      // Fetch transaction sums per category (for the current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: transSums, error: transError } = await supabase
        .from('transactions')
        .select('category_id, value, type')
        .gte('date', firstDay)
        .eq('status', 'confirmed'); // Only confirmed for spending

      if (transError) throw transError;

      const catsWithSpending = cats?.map(cat => {
        const spent = transSums
          ?.filter(t => t.category_id === cat.id && t.type === 'expense')
          .reduce((acc, t) => acc + Number(t.value), 0) || 0;

        const percentage = cat.budget > 0 ? (spent / cat.budget) * 100 : 0;

        return {
          ...cat,
          spent,
          percentage: Math.round(percentage)
        };
      }) || [];

      // 4. Group by hierarchy
      const mainCategories = catsWithSpending.filter(c => !c.parent_id);
      const organizedCats = mainCategories.map(main => ({
        ...main,
        subcategories: catsWithSpending.filter(sub => sub.parent_id === main.id)
      }));

      setCategories(organizedCats);

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();

    const channel = supabase
      .channel('wallet-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        () => fetchWalletData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchWalletData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => fetchWalletData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWalletData]);

  // --- Actions ---

  const openEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setNewAccount({
      name: acc.name,
      type: acc.type,
      balance: acc.balance.toString().replace('.', ','),
      color: acc.color,
      icon: acc.icon || 'account_balance'
    });
    setIsAccountModalOpen(true);
  };

  const openEditCategory = (cat: any) => {
    setEditingCategoryId(cat.id);
    setNewCategory({
      name: cat.name,
      budget: cat.budget ? cat.budget.toString().replace('.', ',') : '',
      budget_is_unlimited: cat.budget_is_unlimited === true,
      icon: cat.icon || 'label',
      color: cat.color,
      parent_id: cat.parent_id || ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!newAccount.name) {
      toast.error('Preencha o nome da conta.');
      return;
    }

    const balanceValue = newAccount.balance
      ? parseFloat(newAccount.balance.replace(/\./g, '').replace(',', '.'))
      : 0;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const accountPayload: any = {
        user_id: user?.id,
        name: newAccount.name,
        type: newAccount.type,
        balance: balanceValue
      };

      // Only add icon and color if they are likely supported (we can't check schema easily here, but we can try)
      if (newAccount.icon) accountPayload.icon = newAccount.icon;
      if (newAccount.color) accountPayload.color = newAccount.color;

      let error;
      if (editingAccountId) {
        ({ error } = await supabase.from('accounts').update(accountPayload).eq('id', editingAccountId));
      } else {
        ({ error } = await supabase.from('accounts').insert(accountPayload));
      }

      if (error) throw error;
      toast.success(editingAccountId ? 'Conta atualizada!' : 'Conta criada com sucesso!');
      setIsAccountModalOpen(false);
      resetForms();
      fetchWalletData();
    } catch (error: any) {
      console.error('Save account error:', error);
      toast.error(`Erro ao salvar conta: ${error.message || 'Verifique o console'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name) {
      toast.error('Nome da categoria é obrigatório.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const budgetValue = newCategory.budget_is_unlimited
        ? 0
        : (newCategory.budget ? Number(newCategory.budget.toString().replace(/\./g, '').replace(',', '.')) || 0 : 0);

      const categoryPayload: any = {
        user_id: user?.id,
        name: newCategory.name,
        budget: budgetValue,
        icon: newCategory.icon,
        color: newCategory.color,
        parent_id: newCategory.parent_id || null
      };

      // Add budget_is_unlimited now that SQL is executed
      if (newCategory.budget_is_unlimited !== undefined) {
        categoryPayload.budget_is_unlimited = newCategory.budget_is_unlimited;
      }

      let error;
      if (editingCategoryId) {
        ({ error } = await supabase.from('categories').update(categoryPayload).eq('id', editingCategoryId));
      } else {
        ({ error } = await supabase.from('categories').insert(categoryPayload));
      }

      if (error) throw error;
      toast.success(editingCategoryId ? 'Categoria atualizada!' : 'Categoria criada!');
      setIsCategoryModalOpen(false);
      resetForms();
      fetchWalletData();
    } catch (error: any) {
      console.error('Save category error:', error);
      toast.error(`Erro ao salvar categoria: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      const table = deleteItem.type === 'account' ? 'accounts' : 'categories';
      const { error } = await supabase.from(table).delete().eq('id', deleteItem.id);

      if (error) throw error;

      toast.success('Item excluído com sucesso.');
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
      fetchWalletData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir item. Verifique se existem transações vinculadas.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForms = () => {
    setEditingCategoryId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const trnas = parseOfx(content);
        if (trnas.length === 0) {
          toast.error('Nenhuma transação encontrada no arquivo.');
          return;
        }
        setImportedTransactions(trnas);
        setIsImportModalOpen(true);
      } catch (err) {
        toast.error('Erro ao processar arquivo OFX.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleConfirmImport = async (finalItems: any[]) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const payload = finalItems.map(item => ({
        user_id: user?.id,
        account_id: item.account_id,
        category_id: item.category_id || null,
        description: item.description,
        value: parseFloat(item.value.replace(/\./g, '').replace(',', '.')),
        type: item.type,
        date: item.date,
        status: 'confirmed'
      }));

      const { error } = await supabase.from('transactions').insert(payload);
      if (error) throw error;

      toast.success(`${finalItems.length} transações importadas com sucesso!`);
      setIsImportModalOpen(false);
      fetchWalletData();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro ao importar transações.');
    } finally {
      setSubmitting(false);
    }
  };

  // Override the create handlers to open modal with clear state
  const openCreateAccount = () => {
    resetForms();
    setIsAccountModalOpen(true);
  };

  const openCreateCategory = () => {
    resetForms();
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col relative animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="w-full py-4 border-b border-[#e7edf3] dark:border-slate-800">
        <PageHeader
          title="Gerenciamento Financeiro"
          description="Configure suas contas bancárias e defina categorias de despesas. A nossa IA utilizará essas definições para classificar automaticamente suas mensagens do WhatsApp."
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWalletData}
                className="!size-10 !p-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </Button>

              <label className="inline-flex items-center justify-center px-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-2 shadow-sm active:scale-95 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                <span className="hidden sm:inline">Importar Extrato</span>
                <span className="sm:hidden">OFX</span>
                <input type="file" accept=".ofx" onChange={handleFileUpload} className="hidden" />
              </label>

              <Button
                onClick={() => setIsAccountModalOpen(true)}
                leftIcon={<span className="material-symbols-outlined text-[20px]">add</span>}
                className="shadow-primary/30"
              >
                <span className="hidden sm:inline">Nova Conta</span>
                <span className="sm:hidden">Conta</span>
              </Button>
            </div>
          }
        />
      </div>

      <div className="space-y-8 pt-8 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Accounts (Wallet) */}
          <div className="xl:col-span-5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary filled">account_balance_wallet</span>
                Minhas Contas
              </h2>
              <Card className="flex flex-col gap-1.5 text-right !p-4">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Saldo Total</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-500">
                  R$ {Math.abs(totalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </Card>
            </div>

            <div className="grid gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              ) : accounts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">Nenhuma conta cadastrada.</div>
              ) : (
                accounts.map(acc => (
                  <AccountCard
                    key={acc.id}
                    name={acc.name}
                    type={acc.type || 'Geral'}
                    balance={Number(acc.currentBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    logo={acc.name.substring(0, 2)}
                    logoIcon={acc.icon}
                    color={acc.color || 'bg-primary'}
                    update="Sincronizado"
                    isNegative={Number(acc.currentBalance) < 0}
                    onEdit={() => openEditAccount(acc)}
                    onDelete={() => {
                      setDeleteItem({ id: acc.id, type: 'account' });
                      setIsDeleteModalOpen(true);
                    }}
                  />
                ))
              )}

              <button
                onClick={openCreateAccount}
                className="border-2 border-dashed border-[#e7edf3] dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all h-24 sm:h-28"
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-sm font-bold">Adicionar Nova Conta</span>
              </button>
            </div>
          </div>

          {/* Right Column: Categories Management */}
          <div className="xl:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">category</span>
                Categorias e Orçamentos
              </h2>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3 shadow-sm">
              <span className="material-symbols-outlined text-primary mt-0.5 filled">auto_awesome</span>
              <div className="text-sm">
                <p className="font-bold text-slate-900 dark:text-white">Classificação Automática Ativa</p>
                <p className="text-slate-500 dark:text-slate-400">O assistente de IA usará os nomes e limites definidos abaixo para organizar seus comprovantes enviados no WhatsApp.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm divide-y divide-[#e7edf3] dark:divide-slate-800 overflow-hidden">
              {loading ? (
                <div className="py-12 text-center text-slate-400 italic">Carregando categorias...</div>
              ) : categories.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic">Nenhuma categoria cadastrada.</div>
              ) : (
                categories.map(cat => (
                  <CategoryItem
                    key={cat.id}
                    id={cat.id}
                    name={cat.name}
                    icon={cat.icon || 'label'}
                    iconColor={cat.color || 'bg-slate-100 text-slate-600'}
                    spent={Number(cat.spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    budget={cat.budget}
                    percentage={cat.percentage}
                    subcategories={cat.subcategories}
                    iaReady={true}
                    critical={cat.budget > 0 && cat.percentage > 100}
                    warning={cat.budget > 0 && cat.percentage > 80}
                    isInfinite={cat.budget_is_unlimited}
                    onEdit={openEditCategory}
                    onDelete={(item: any) => {
                      setDeleteItem({ id: item.id, type: 'category' });
                      setIsDeleteModalOpen(true);
                    }}
                  />
                ))
              )}
            </div>

            <button
              onClick={openCreateCategory}
              className="w-full py-3 rounded-xl border border-[#e7edf3] dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-400 font-bold text-sm hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined">add</span>
              Criar Nova Categoria Principal
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {/* Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Nova Conta"
        footer={
          <>
            <button onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancelar</button>
            <button
              onClick={handleSaveAccount}
              disabled={submitting}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : (editingAccountId ? 'Atualizar Conta' : 'Criar Conta')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Conta</label>
            <input
              type="text"
              className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ex: Nubank Principal"
              value={newAccount.name}
              onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
            <select
              className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={newAccount.type}
              onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
            >
              <option>Conta Corrente</option>
              <option>Conta Poupança</option>
              <option>Cartão de Crédito</option>
              <option>Investimento</option>
              <option>Dinheiro (Caixa)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Saldo Inicial</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
              <input
                type="text"
                className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="0,00"
                value={newAccount.balance}
                onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 ml-1">Comece com 0,00 se for uma conta nova.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Escolha o Banco</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 border border-slate-100 dark:border-slate-700 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-850">
              {[
                { name: 'Nubank', color: 'bg-[#8A05BE]', logo: '/img/banks/nubank.svg' },
                { name: 'Itaú', color: 'bg-[#EC7000]', logo: '/img/banks/itau.svg' },
                { name: 'Bradesco', color: 'bg-[#CC092F]', logo: '/img/banks/bradesco.svg' },
                { name: 'BB', color: 'bg-[#F7D116]', logo: '/img/banks/banco-do-brasil.svg' },
                { name: 'Inter', color: 'bg-[#FF7A00]', logo: '/img/banks/inter.svg' },
                { name: 'Santander', color: 'bg-[#EC0000]', logo: '/img/banks/santander.svg' },
                { name: 'Caixa', color: 'bg-[#005CA9]', logo: '/img/banks/caixa.svg' },
                { name: 'C6 Bank', color: 'bg-black', logo: '/img/banks/c6.svg' },
                { name: 'Cora', color: 'bg-[#FE3D2D]', logo: '/img/banks/cora.svg' },
                { name: 'Mercado Pago', color: 'bg-[#00B1EA]', logo: '/img/banks/mercado-pago.svg' },
                { name: 'PagBank', color: 'bg-[#00C250]', logo: '/img/banks/pagbank.svg' },
                { name: 'InfinityPay', color: 'bg-[#3C28ED]', logo: '/img/banks/infinitypay.svg' },
                { name: 'Outros', color: 'bg-slate-500', logo: '/img/banks/outro.svg' },
              ].map(bank => (
                <button
                  key={bank.name}
                  type="button"
                  onClick={() => setNewAccount({ ...newAccount, color: bank.color, icon: bank.logo })}
                  className={`relative size-10 flex items-center justify-center rounded-xl transition-all duration-200 ${newAccount.icon === bank.logo ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow-lg shadow-primary/30' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                  title={bank.name}
                >
                  <div className={`size-full rounded-xl ${bank.color} flex items-center justify-center overflow-hidden`}>
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                        (e.target as any).parentElement.innerHTML = `<span class="material-symbols-outlined text-[18px]">account_balance</span>`;
                      }}
                    />
                  </div>
                  {newAccount.icon === bank.logo && (
                    <div className="absolute -bottom-1 -right-1 size-5 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                      <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
        footer={
          <>
            <button onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancelar</button>
            <button
              onClick={handleSaveCategory}
              disabled={submitting}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : (editingCategoryId ? 'Atualizar Categoria' : 'Criar Categoria')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
            <input
              type="text"
              className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ex: Alimentação, Transporte"
              value={newCategory.name}
              onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-500 uppercase">Orçamento Mensal (Meta)</label>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setNewCategory({ ...newCategory, budget_is_unlimited: !newCategory.budget_is_unlimited })}>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${newCategory.budget_is_unlimited ? 'bg-primary' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${newCategory.budget_is_unlimited ? 'translate-x-4' : 'translate-x-0'} left-0.5`}></div>
              </div>
              <span className="text-xs font-bold text-slate-600">Sem limite</span>
            </div>
          </div>
          <div className="relative">
            {!newCategory.budget_is_unlimited && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
            )}
            <input
              type="text"
              disabled={newCategory.budget_is_unlimited}
              className={`w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${newCategory.budget_is_unlimited ? 'bg-slate-50 dark:bg-slate-850 text-slate-400 pl-3 italic' : 'pl-10 pr-3'}`}
              placeholder={newCategory.budget_is_unlimited ? "Lançamentos ilimitados para esta categoria" : "0,00"}
              value={newCategory.budget_is_unlimited ? '' : newCategory.budget}
              onChange={e => setNewCategory({ ...newCategory, budget: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria Pai (Hierarquia)</label>
            <select
              className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none"
              value={newCategory.parent_id}
              onChange={e => {
                const pid = e.target.value;
                const parent = categories.find(c => c.id === pid);
                setNewCategory({
                  ...newCategory,
                  parent_id: pid,
                  icon: parent ? parent.icon : newCategory.icon,
                  color: parent ? parent.color : newCategory.color
                });
              }}
            >
              <option value="">Nenhuma (Categoria Principal)</option>
              {categories.filter(c => c.id !== editingCategoryId).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1 ml-1">Selecione se deseja que esta seja uma subcategoria.</p>
          </div>
          <div className="space-y-4">
            <div className={newCategory.parent_id ? 'opacity-50 pointer-events-none' : ''}>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase">Escolha um Ícone</label>
                {newCategory.parent_id && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">Herdado do pai</span>
                )}
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 border border-slate-100 dark:border-slate-700 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-850">
                {[
                  'shopping_bag', 'shopping_cart', 'restaurant', 'directions_car', 'home',
                  'payments', 'health_and_safety', 'fitness_center', 'school', 'build',
                  'pets', 'flight', 'store', 'work', 'savings',
                  'bolt', 'water_drop', 'wifi', 'movie', 'label'
                ].map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                    className={`size-10 flex items-center justify-center rounded-xl transition-all duration-200 relative ${newCategory.icon === icon ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 scale-110 ring-2 ring-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary hover:scale-105 hover:shadow-md'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    {newCategory.icon === icon && (
                      <div className="absolute -bottom-1 -right-1 size-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-850 shadow-md">
                        <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className={newCategory.parent_id ? 'opacity-50 pointer-events-none' : ''}>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor da Categoria</label>
              <select
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none"
                value={newCategory.color}
                onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
              >
                <option value="bg-slate-100 text-slate-600">Cinza</option>
                <option value="bg-blue-100 text-blue-600">Azul</option>
                <option value="bg-green-100 text-green-600">Verde</option>
                <option value="bg-red-100 text-red-600">Vermelho</option>
                <option value="bg-orange-100 text-orange-600">Laranja</option>
                <option value="bg-purple-100 text-purple-600">Roxo</option>
                <option value="bg-amber-100 text-amber-600">Amarelo</option>
                <option value="bg-teal-100 text-teal-600">Teal</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={deleteItem?.type === 'account' ? "Excluir Conta?" : "Excluir Categoria?"}
        message="Esta ação removerá o item permanentemente. Transações vinculadas poderão ficar sem categoria/conta."
        confirmLabel="Sim, Excluir"
        type="danger"
      />

      {/* Import Review Modal */}
      <ImportReviewModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        transactions={importedTransactions}
        categories={categories}
        accounts={accounts.map(a => ({ value: a.id, label: a.name, icon: 'account_balance' }))}
        onConfirm={handleConfirmImport}
        submitting={submitting}
      />

    </div>
  );
};

export default Wallet;
