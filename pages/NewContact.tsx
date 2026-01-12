import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import InputMask from '../components/InputMask';
import { MASKS, fetchCompanyData } from '../utils/utils';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';

const NewContact: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    category: 'Cliente',
    phone: '',
    email: '',
    balance: '0'
  });

  const [contactType, setContactType] = useState<'Cliente' | 'Fornecedor'>('Cliente');
  const [searchParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam === 'Fornecedor') {
      setContactType('Fornecedor');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchContact = async () => {
      if (isEdit) {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', id)
          .single();

        if (data) {
          // Se for funcionário sendo editado aqui por engano, redirecionamos para a tela correta de equipe
          if (data.category === 'Funcionário') {
            navigate(`/team/edit/${id}`);
            return;
          }

          setFormData({
            name: data.name,
            id_number: data.id_number || '',
            category: data.category || 'Cliente',
            phone: data.phone ? (data.phone.startsWith('55') && data.phone.length > 11 ? data.phone.substring(2) : data.phone) : '',
            email: data.email || '',
            balance: data.balance.toString()
          });
          setContactType(data.category as any);
        }
        setFetching(false);
      }
    };

    fetchContact();
  }, [id, isEdit, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      id_number: formData.id_number || null,
      category: contactType,
      phone: formData.phone ? (formData.phone.replace(/\D/g, '').length <= 11 ? `55${formData.phone.replace(/\D/g, '')}` : formData.phone.replace(/\D/g, '')) : null,
      email: formData.email || null,
      balance: parseFloat(formData.balance.replace(',', '.') || '0'),
      user_id: (await supabase.auth.getUser()).data.user?.id
    };

    let result;
    if (isEdit) {
      result = await supabase.from('contacts').update(payload).eq('id', id);
    } else {
      result = await supabase.from('contacts').insert([payload]);
    }

    if (result.error) {
      toast.error('Erro ao salvar contato: ' + result.error.message);
    } else {
      toast.success(isEdit ? 'Contato atualizado com sucesso!' : 'Contato cadastrado com sucesso!');
      navigate('/contacts');
    }
    setLoading(false);
  };

  const handleCnpjBlur = async () => {
    const cnpj = formData.id_number.replace(/\D/g, '');
    if (cnpj.length === 14) {
      const toastId = toast.loading('Buscando dados do CNPJ...');
      const data = await fetchCompanyData(cnpj);
      if (data) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || data.razao_social,
          email: prev.email || data.email || '',
          phone: prev.phone || data.ddd_telefone_1 || ''
        }));
        toast.success('Dados do CNPJ carregados!', { id: toastId });
      } else {
        toast.error('Não foi possível encontrar dados para este CNPJ.', { id: toastId });
      }
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Carregando dados do contato...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="w-full px-8 py-6 border-b border-[#e7edf3] dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <PageHeader
            title={isEdit ? 'Editar Contato' : 'Novo Contato'}
            description={isEdit ? 'Atualize os dados cadastrais do cliente ou fornecedor abaixo.' : 'Adicione um novo cliente ou fornecedor à sua base.'}
            actions={
              <button
                type="button"
                onClick={() => navigate(-1)}
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
                  Dados Cadastrais
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">Nome / Razão Social</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                    </div>
                    <input
                      className="w-full pl-10 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm py-2.5 outline-none transition-all"
                      placeholder="Ex: João Silva ou Empresa LTDA"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">CPF / CNPJ</label>
                  <InputMask
                    mask={[
                      { mask: MASKS.CPF },
                      { mask: MASKS.CNPJ }
                    ]}
                    value={formData.id_number}
                    onAccept={(val) => setFormData({ ...formData, id_number: val })}
                    onBlur={handleCnpjBlur}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5">Saldo em Aberto (R$)</label>
                  <InputMask
                    mask={MASKS.CURRENCY}
                    value={formData.balance}
                    onAccept={(val) => setFormData({ ...formData, balance: val })}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <span className="material-symbols-outlined text-primary">contacts</span>
                Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row justify-end gap-4 mt-2">
              <button
                onClick={() => navigate(-1)}
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
                    {isEdit ? 'Salvar Alterações' : 'Salvar Contato'}
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

export default NewContact;