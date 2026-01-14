import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import InputMask from '../components/InputMask';
import { MASKS, formatCpfCnpj } from '../utils/utils';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import { WeightIcon } from '../components/BrandedIcons';
import Button from '../components/Button';
import Input from '../components/Input';

const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [contacts, setContacts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]); // New state for sellers
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchContact, setSearchContact] = useState('');
  const [showContactList, setShowContactList] = useState(false);
  const [originalSale, setOriginalSale] = useState<{ value: number; shipping: number; client_id: string } | null>(null);

  const [formData, setFormData] = useState({
    date: (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })(),
    client_id: '',
    client_name: '',
    account_id: '',
    value: '',
    weight: '',
    shipping: '',
    seller: '',
    code: '',
    is_ai: false
  });

  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase.from('contacts').select('*').order('name');
      setContacts(data || []);

      // Filter sellers
      const sellersList = (data || []).filter(c => c.category === 'Vendedor');
      setSellers(sellersList);
    };

    const fetchAccounts = async () => {
      const { data } = await supabase.from('accounts').select('*').order('name');
      setAccounts(data || []);
    };

    const fetchSale = async () => {
      if (isEdit) {
        const { data, error } = await supabase
          .from('sales')
          .select('*, contacts(name)')
          .eq('id', id)
          .single();

        if (data) {
          setOriginalSale({
            value: data.value,
            shipping: data.shipping || 0,
            client_id: data.client_id || ''
          });
          setFormData({
            date: data.date,
            client_id: data.client_id || '',
            client_name: data.contacts?.name || '',
            account_id: data.account_id || '',
            value: data.value.toString(),
            weight: data.weight?.toString() || '',
            shipping: data.shipping?.toString() || '',
            seller: data.seller || '',
            code: data.code || '',
            is_ai: data.is_ai || false
          });
        }
        setFetching(false);
      }
    };

    fetchContacts();
    fetchAccounts();
    fetchSale();
  }, [id, isEdit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: Record<string, any> = {
      date: formData.date,
      value: parseFloat(formData.value.replace(',', '.') || '0'),
      shipping: parseFloat(formData.shipping || '0') || 0,
      seller: isEdit ? (formData.seller || 'Manual') : 'Manual', // Force 'Manual' for new manual sales
      is_ai: isEdit ? formData.is_ai : false // Persistent flag
    };

    // Only add optional fields if they have values
    if (formData.client_id) payload.client_id = formData.client_id;
    if (formData.weight) payload.weight = parseFloat(formData.weight) || null;
    if (formData.code) {
      payload.code = formData.code;
    } else if (!isEdit) {
      payload.code = `MAN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }


    let result;
    if (isEdit) {
      result = await supabase.from('sales').update(payload).eq('id', id).select();
    } else {
      result = await supabase.from('sales').insert([payload]).select();
    }

    if (result.error) {
      toast.error('Erro ao salvar venda: ' + result.error.message);
    } else {
      // Update contact balance
      const newValue = parseFloat(formData.value.replace(',', '.') || '0');
      const newShipping = parseFloat(formData.shipping || '0') || 0;
      const newTotal = newValue + newShipping;

      if (isEdit && originalSale) {
        if (originalSale.client_id === formData.client_id) {
          // Same contact, update difference
          const oldTotal = originalSale.value + originalSale.shipping;
          const diff = newTotal - oldTotal;
          if (diff !== 0 && formData.client_id) {
            const { data: contact } = await supabase.from('contacts').select('balance').eq('id', formData.client_id).single();
            if (contact) {
              await supabase.from('contacts').update({ balance: contact.balance + diff }).eq('id', formData.client_id);
            }
          }
        } else {
          // Different contact
          if (originalSale.client_id) {
            const { data: oldContact } = await supabase.from('contacts').select('balance').eq('id', originalSale.client_id).single();
            if (oldContact) {
              await supabase.from('contacts').update({ balance: oldContact.balance - (originalSale.value + originalSale.shipping) }).eq('id', originalSale.client_id);
            }
          }
          if (formData.client_id) {
            const { data: newContact } = await supabase.from('contacts').select('balance').eq('id', formData.client_id).single();
            if (newContact) {
              await supabase.from('contacts').update({ balance: (newContact.balance || 0) + newTotal }).eq('id', formData.client_id);
            }
          }
        }
      } else if (!isEdit && formData.client_id) {
        // New sale
        const { data: contact } = await supabase.from('contacts').select('balance').eq('id', formData.client_id).single();
        if (contact) {
          await supabase.from('contacts').update({ balance: (contact.balance || 0) + newTotal }).eq('id', formData.client_id);
        }
      }

      toast.success(isEdit ? 'Venda atualizada com sucesso!' : 'Venda cadastrada com sucesso!');
      navigate('/sales');
    }
    setLoading(false);
  };

  const selectContact = (contact: any) => {
    setFormData({ ...formData, client_id: contact.id, client_name: contact.name });
    setSearchContact('');
    setShowContactList(false);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Carregando dados da venda...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex-1 flex flex-col">
      {/* Header Area */}
      <div className="w-full px-8 py-6 border-b border-[#e7edf3] dark:border-slate-800">
        <div className="max-w-[1000px] mx-auto">
          <PageHeader
            title={isEdit ? 'Editar Venda' : 'Adicionar Venda Manual'}
            description={isEdit ? 'Atualize os dados da venda abaixo.' : 'Preencha os dados abaixo para registrar uma nova venda manualmente.'}
            actions={
              <Button
                variant="outline"
                onClick={() => navigate('/sales')}
                leftIcon={<span className="material-symbols-outlined text-[20px]">arrow_back</span>}
              >
                Voltar
              </Button>
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
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Dados da Venda
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm p-6 flex flex-col gap-8 w-full">
              {/* Client Selection */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-slate-900 dark:text-white text-sm font-medium">Cliente</label>
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
                {/* Sale Date */}
                <Input
                  label={<>Data da Venda <span className="text-red-500">*</span></>}
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />

                {/* Internal Code */}
                <Input
                  label="Código Interno"
                  placeholder="Geração automática se vazio"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  leftIcon={<span className="material-symbols-outlined text-slate-400 text-[20px]">tag</span>}
                />

                <InputMask
                  label={<>Valor Total (R$) <span className="text-red-500">*</span></>}
                  mask={MASKS.CURRENCY}
                  value={formData.value}
                  onAccept={(val) => setFormData({ ...formData, value: val })}
                  placeholder="0,00"
                  leftIcon={<span className="text-slate-400 font-bold">R$</span>}
                  className="font-bold text-lg"
                />

                {/* Weight */}
                <Input
                  label="Peso (g)"
                  type="number"
                  placeholder="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  leftIcon={<WeightIcon className="size-5 text-slate-400" />}
                  rightIcon={<span className="text-slate-400 font-bold text-xs">gramas</span>}
                />

                {/* Shipping */}
                <InputMask
                  label="Frete (R$)"
                  mask={MASKS.CURRENCY}
                  value={formData.shipping}
                  onAccept={(val) => setFormData({ ...formData, shipping: val })}
                  placeholder="0,00"
                  leftIcon={<span className="text-slate-400 font-bold">R$</span>}
                  rightIcon={<span className="material-symbols-outlined text-slate-400 text-sm">local_shipping</span>}
                  className="font-bold text-lg"
                />

                {/* Seller Selection - Hidden for new manual sales as requested */}
                {isEdit && (
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-900 dark:text-white text-sm font-medium">Vendedor Responsável <span className="text-slate-400 text-xs font-normal">(Cadastrados em Contatos)</span></label>
                    <CustomSelect
                      value={formData.seller}
                      onChange={(val) => setFormData({ ...formData, seller: val })}
                      placeholder="Selecione um vendedor"
                      icon="person"
                      options={sellers.map(s => ({ value: s.name, label: s.name }))}
                    />
                    {sellers.length === 0 && (
                      <p className="text-xs text-amber-500">Nenhum vendedor cadastrado. <Link to="/sellers" className="underline">Cadastre aqui</Link>.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Form Footer Actions */}
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-end items-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/sales')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  isLoading={loading}
                  leftIcon={<span className="material-symbols-outlined group-hover:scale-110 transition-transform">save</span>}
                >
                  {isEdit ? 'Salvar Alterações' : 'Cadastrar Venda'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default NewSale;