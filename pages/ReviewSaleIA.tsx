import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const ReviewSaleIA: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // This is the whatsapp_message_id (from Review page) OR sale_id?
  // Assuming it's the Message ID from the "Review" page flow.

  const [loading, setLoading] = React.useState(true);
  const [mainMessage, setMainMessage] = React.useState<any>(null);
  const [conversation, setConversation] = React.useState<any[]>([]);
  const [contact, setContact] = React.useState<any>(null);

  React.useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        // 1. Fetch the triggering message
        const { data: msg, error: msgError } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('id', id)
          .single();

        if (msgError) throw msgError;
        setMainMessage(msg);

        // 2. Fetch Contact
        // Extract phone number from remote_jid
        const phone = msg.remote_jid.split('@')[0].replace('55', '');
        const { data: contacts } = await supabase.from('contacts').select('*');
        const matchedContact = contacts?.find(c => c.phone?.replace(/\D/g, '').includes(phone));
        setContact(matchedContact);

        // 3. Fetch Context (Last 10 messages from this contact)
        const { data: history } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('remote_jid', msg.remote_jid)
          .lte('created_at', msg.created_at) // Messages up to this one
          .order('created_at', { ascending: false })
          .limit(10);

        setConversation((history || []).reverse()); // Show oldest first

      } catch (error) {
        console.error('Failed to load sale review data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Carregando dados da venda...</div>;
  if (!mainMessage) return <div className="p-10 text-center">Mensagem não encontrada.</div>;

  return (
    <div className="flex-1 flex flex-col">
      {/* Page Heading */}
      <div className="w-full px-6 py-5 border-b border-[#e7edf3] dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex min-w-72 flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Revisão de Venda #{id?.substring(0, 6)}</h1>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-200">Aguardando Revisão</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Detectado via WhatsApp em {new Date(mainMessage.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            </div>
            <button
              onClick={() => navigate('/review')}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e7edf3] dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white text-sm font-bold gap-2"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="truncate">Voltar para Revisão</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Columns */}
      <div className="flex-1 w-full bg-background-light dark:bg-background-dark p-6">
        <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Chat Context */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full">
            <h2 className="text-slate-900 dark:text-white tracking-tight text-[20px] font-bold leading-tight px-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">chat</span>
              Contexto da Conversa
            </h2>

            <div className="flex-1 bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm flex flex-col overflow-hidden max-h-[800px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-[#e7edf3] dark:border-slate-800 flex items-center gap-3 bg-[#fafafa] dark:bg-slate-900/50">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 ring-1 ring-gray-200" style={{ backgroundImage: `url(https://ui-avatars.com/api/?name=${contact?.name || '?'}&background=random)` }}></div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{contact?.name || 'Desconhecido'}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                  </p>
                </div>
                <div className="ml-auto">
                  <span className="material-symbols-outlined text-slate-400 cursor-pointer">more_vert</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#efe7dd] dark:bg-[#0b141a]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAVN0zRzHw0vayZkh4WuunqzaQpRDLQNpCeHLOup6Z1hhRu8d-cJbvDD-fsZLsXVJO6NQOqA9f_RunFAcjHqioVPJCuxcit-f-whE1CahujXcLWSdsKxZUZteC2wXIj4fxjrXNBAA-WRZsTKkM00wLESeIVr0s2bWcd__GrxHEmMHxpfXJ-S7Teme0YUqF0kse_299MdvT0WUu1eRa-iTj0IwdAStX4bomm43dvvFUqpBHUKsXDu39jNZIgJRhKsBtwxuwx0ZH5pm0O')", backgroundBlendMode: 'overlay' }}>

                {conversation.map((msg: any) => (
                  <div key={msg.id} className="flex items-end gap-2 group">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0 mb-1"
                      style={{ backgroundImage: `url(https://ui-avatars.com/api/?name=${contact?.name || '?'}&background=random)` }}
                    ></div>
                    <div className="flex flex-col gap-1 items-start max-w-[85%]">
                      <div className={`p-3 rounded-lg rounded-bl-none shadow-sm relative text-sm leading-relaxed border border-transparent transition-colors ${msg.id === mainMessage.id ? 'bg-primary/10 text-slate-900 dark:text-white border-primary/50' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'}`}>
                        <p>{msg.content}</p>
                        <span className="text-[10px] text-slate-400 block text-right mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </span>
                        {msg.id === mainMessage.id && (
                          <div className="absolute -top-3 -right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">auto_awesome</span> IA
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Extraction Form */}
          <div className="lg:col-span-7 flex flex-col gap-4 h-full">
            {/* ... keeping existing form structure but with Real Data if we were extracting it properly ... */}
            <div className="flex justify-between items-center px-1">
              <h2 className="text-slate-900 dark:text-white tracking-tight text-[20px] font-bold leading-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                Dados Extraídos
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-850 rounded-xl border border-[#e7edf3] dark:border-slate-800 shadow-sm p-6 flex flex-col gap-8 h-full">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[#e7edf3] dark:border-slate-800">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-14 h-14" style={{ backgroundImage: `url(https://ui-avatars.com/api/?name=${contact?.name || '?'}&background=random)` }}></div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{contact?.name || 'Cliente Não Identificado'}</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">call</span> {contact?.phone || mainMessage.remote_jid}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 italic text-center py-10">
                Funcionalidade de Extração Detalhada de Vendas em desenvolvimento.<br />
                Por favor, use a tela de "Nova Venda" para processar este pedido.
              </p>
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                <button onClick={() => navigate('/review')} className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2">Cancelar</button>
                <button onClick={() => toast.success('Funcionalidade em breve!')} className="px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-primary/90">
                  Confirmar Venda
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReviewSaleIA;