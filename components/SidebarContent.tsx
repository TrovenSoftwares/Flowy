import React from 'react';
import { Link } from 'react-router-dom';
import SidebarLink from './SidebarLink';

import { supabase } from '../lib/supabase';

interface SidebarContentProps {
  locationPath: string;
  onItemClick?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ locationPath, onItemClick }) => {
  const [reviewCount, setReviewCount] = React.useState(0);

  const fetchReviewCount = React.useCallback(async () => {
    try {
      // 1. Get monitored contacts phones
      const { data: contacts } = await supabase
        .from('contacts')
        .select('phone')
        .eq('whatsapp_monitoring', true);

      const monitoredPhones = contacts?.map(c => c.phone?.replace(/\D/g, '')) || [];
      if (monitoredPhones.length === 0) {
        setReviewCount(0);
        return;
      }

      // 2. Fetch pending messages
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('remote_jid')
        .eq('status', 'pending');

      // 3. Filter only those from monitored contacts
      const count = (messages || []).filter(m => {
        const phone = m.remote_jid.split('@')[0].replace('55', '');
        return monitoredPhones.some(p => p.includes(phone));
      }).length;

      setReviewCount(count);
    } catch (error) {
      console.error('Error fetching review count:', error);
    }
  }, []);

  React.useEffect(() => {
    fetchReviewCount();
    const interval = setInterval(fetchReviewCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchReviewCount]);

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1" role="navigation" aria-label="Menu Principal">
      <SidebarLink to="/" icon="dashboard" label="Dashboard" currentPath={locationPath} onClick={onItemClick} />

      <div className="mt-4 mb-2 px-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financeiro</span>
      </div>

      <SidebarLink to="/transactions" icon="receipt_long" label="Transações" currentPath={locationPath} onClick={onItemClick} />
      <SidebarLink to="/bounced-checks" icon="money_off" label="Cheques Devolvidos" currentPath={locationPath} onClick={onItemClick} />
      <SidebarLink to="/returns" icon="assignment_return" label="Devoluções" currentPath={locationPath} onClick={onItemClick} />

      <div className="mt-4 mb-2 px-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operacional</span>
      </div>

      <SidebarLink to="/sales" icon="sell" label="Vendas" currentPath={locationPath} onClick={onItemClick} />
      <SidebarLink to="/sellers" icon="storefront" label="Vendedores" currentPath={locationPath} onClick={onItemClick} />
      <SidebarLink to="/contacts" icon="group" label="Contatos" currentPath={locationPath} onClick={onItemClick} />
      <SidebarLink to="/team" icon="badge" label="Equipe" currentPath={locationPath} onClick={onItemClick} />

      <div className="mt-4 mb-2 px-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inteligência</span>
      </div>

      <Link
        to="/review"
        onClick={onItemClick}
        aria-current={locationPath.includes('/review') ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${locationPath.includes('/review')
          ? 'bg-primary text-white shadow-md shadow-primary/20'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
      >
        <span className={`material-symbols-outlined ${locationPath.includes('/review') ? 'filled' : ''}`}>smart_toy</span>
        <div className="flex flex-1 items-center justify-between">
          <span className={`text-sm ${locationPath.includes('/review') ? 'font-semibold' : 'font-medium'}`}>Revisão IA</span>
          {reviewCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm" aria-label={`${reviewCount} itens pendentes`}>
              {reviewCount}
            </span>
          )}
        </div>
      </Link>

      <SidebarLink to="/wallet" icon="wallet" label="Carteira" currentPath={locationPath} onClick={onItemClick} />
      <SidebarLink to="/reports" icon="analytics" label="Relatórios" currentPath={locationPath} onClick={onItemClick} />

      {/* Integrações - Somente Desktop */}
      <div className="hidden lg:block">
        <SidebarLink to="/integration" icon="hub" label="Integrações" currentPath={locationPath} onClick={onItemClick} />
      </div>

      <SidebarLink to="/documentation" icon="description" label="Documentação" currentPath={locationPath} onClick={onItemClick} />

      <div className="my-2 border-t border-slate-100 dark:border-slate-700" />

      <SidebarLink to="/settings" icon="settings" label="Ajustes" currentPath={locationPath} onClick={onItemClick} />
    </nav>
  );
};

export default SidebarContent;
