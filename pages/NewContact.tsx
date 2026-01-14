import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import InputMask from '../components/InputMask';
import { MASKS, fetchCompanyData } from '../utils/utils';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Input from '../components/Input';

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
            email: data.email || ''
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
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                leftIcon={<span className="material-symbols-outlined text-[20px]">arrow_back</span>}
              >
                Voltar
              </Button>
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
                  <Input
                    label="Nome / Razão Social"
                    placeholder="Ex: João Silva ou Empresa LTDA"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    leftIcon={<span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>}
                  />
                </div>
                <div>
                  <InputMask
                    label="CPF / CNPJ"
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
              </div>
            </div>

            <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <span className="material-symbols-outlined text-primary">contacts</span>
                Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="E-mail"
                    placeholder="email@exemplo.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    leftIcon={<span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>}
                  />
                </div>
                <div>
                  <InputMask
                    label="Telefone / WhatsApp"
                    mask={MASKS.PHONE}
                    value={formData.phone}
                    onAccept={(val) => setFormData({ ...formData, phone: val })}
                    placeholder="(00) 00000-0000"
                    leftIcon={<span className="material-symbols-outlined text-slate-400 text-[18px]">call</span>}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row justify-end gap-4 mt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                leftIcon={<span className="material-symbols-outlined">save</span>}
              >
                {isEdit ? 'Salvar Alterações' : 'Salvar Contato'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewContact;