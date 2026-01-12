import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/utils';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';
import PageHeader from '../components/PageHeader';
import { extractFinancialDataWithAI } from '../lib/groq';

// --- Global Type Definitions ---
type AutoClassification = 'transaction' | 'sale' | 'discard';

interface PendingMessage {
  id: string;
  created_at: string;
  instance_name: string;
  remote_jid: string;
  content: string;
  message_type: string;
  status: string;
  raw_data: any;
  contact_name?: string;
  contact_id?: string;
  contact_avatar?: string;
  classification: AutoClassification;
  ignore_reason?: string;
  editData: {
    value: string;
    date: string;
    description: string;
    category_id: string;
    account_id: string;
    client_id?: string;
    client_name?: string;
    type: 'income' | 'expense';
    weight?: string;
    shipping?: string;
    seller?: string;
  };
}

// --- Subcomponents ---

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center gap-4">
    <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
      <span className="material-symbols-outlined text-4xl">inbox</span>
    </div>
    <p className="text-slate-500 font-medium">{message}</p>
  </div>
);

const TransactionReviewCard = ({ msg, categories, accounts, clients, onUpdate, onApprove, onReject, onAiRefine, processingId, aiLoadingId, hasAiKey }: any) => (
  <article className={`flex flex-col rounded-xl border border-[#e7edf3] dark:border-slate-800 bg-white dark:bg-slate-850 shadow-sm transition-all overflow-hidden ${processingId === msg.id ? 'opacity-50 pointer-events-none' : ''}`}>
    {/* Context */}
    <div className="bg-[#fcfdfd] dark:bg-slate-900/30 p-4 sm:p-6 border-b border-[#e7edf3] dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={msg.contact_avatar} className="size-10 rounded-full border border-slate-200" alt={msg.contact_name} />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{msg.contact_name}</p>
            <p className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-800">
          WHATSAPP
        </span>
      </div>
      <div className="relative max-w-[90%] rounded-2xl rounded-tl-none bg-[#dcf8c6] dark:bg-[#005c4b] p-4 text-slate-800 dark:text-slate-100 shadow-sm border border-black/5">
        <p className="text-sm leading-relaxed">{msg.content}</p>

        {hasAiKey && (
          <button
            onClick={() => onAiRefine(msg)}
            disabled={aiLoadingId === msg.id || processingId === msg.id}
            className="absolute -right-3 -bottom-3 size-10 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-amber-500 hover:scale-110 transition-all active:scale-95 disabled:opacity-50 group/btn"
            title="Refinar com IA"
          >
            <span className={`material-symbols-outlined text-[20px] ${aiLoadingId === msg.id ? 'animate-spin' : ''}`}>
              {aiLoadingId === msg.id ? 'sync' : 'auto_awesome'}
            </span>
          </button>
        )}
      </div>
    </div>

    {/* Form */}
    <div className="p-6 flex flex-col justify-between">
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Classificação Financeira</h3>
          <p className="text-xs text-slate-500">Pagamento ou Recebimento identificado</p>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">R$</span>
              <input
                className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-sm focus:ring-primary focus:border-primary dark:text-white shadow-sm font-bold"
                type="text"
                placeholder="0,00"
                value={msg.editData.value}
                onChange={(e) => onUpdate(msg.id, 'value', e.target.value)}
              />
            </div>
          </div>

          <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
          <div className="relative">
            <CustomSelect
              value={msg.editData.type}
              onChange={(val) => onUpdate(msg.id, 'type', val)}
              options={[
                { value: 'income', label: 'Entrada (Receita)', icon: 'arrow_upward' },
                { value: 'expense', label: 'Saída (Despesa)', icon: 'arrow_downward' }
              ]}
              placeholder="Selecione..."
            />
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
            <input
              className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-sm focus:ring-primary focus:border-primary dark:text-white shadow-sm"
              type="date"
              value={msg.editData.date}
              onChange={(e) => onUpdate(msg.id, 'date', e.target.value)}
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
            <input
              className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-sm focus:ring-primary focus:border-primary dark:text-white shadow-sm"
              type="text"
              value={msg.editData.description}
              onChange={(e) => onUpdate(msg.id, 'description', e.target.value)}
            />
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
            <CustomSelect
              value={msg.editData.category_id}
              onChange={(val) => onUpdate(msg.id, 'category_id', val)}
              placeholder="Selecionar..."
              options={categories.map((c: any) => ({ value: c.id, label: c.name, icon: c.icon || 'label' }))}
            />
          </div>

          {msg.editData.type === 'income' && (
            <div className="col-span-1 sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente (Opcional)</label>
              <CustomSelect
                value={msg.editData.client_id}
                onChange={(val) => onUpdate(msg.id, 'client_id', val)}
                placeholder="Nenhum / Mesmo do WhatsApp"
                icon="person"
                options={clients.map((c: any) => ({ value: c.id, label: c.name }))}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#e7edf3] dark:border-slate-800 pt-4">
        <button
          onClick={() => onReject(msg.id)}
          className="flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          Ignorar
        </button>
        <button
          onClick={() => onApprove(msg)}
          disabled={processingId === msg.id}
          className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
        >
          {processingId === msg.id ? 'Salvando...' : 'Aprovar e Lançar'}
        </button>
      </div>
    </div>
  </article>
);

const SaleReviewCard = ({ msg, categories, accounts, clients, sellers, onUpdate, onApprove, onReject, onAiRefine, processingId, aiLoadingId, hasAiKey }: any) => (
  <article className={`flex flex-col rounded-xl border border-[#e7edf3] dark:border-slate-800 bg-white dark:bg-slate-850 shadow-sm transition-all overflow-hidden ${processingId === msg.id ? 'opacity-50 pointer-events-none' : ''}`}>
    {/* Context */}
    <div className="bg-[#fcfdfd] dark:bg-slate-900/30 p-4 sm:p-6 border-b border-[#e7edf3] dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={msg.contact_avatar} className="size-10 rounded-full border border-slate-200" alt={msg.contact_name} />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{msg.contact_name}</p>
            <p className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
          POSSÍVEL VENDA
        </span>
      </div>
      <div className="relative max-w-[90%] rounded-2xl rounded-tl-none bg-[#e8f4fd] dark:bg-[#0c4a6e] p-4 text-slate-800 dark:text-slate-100 shadow-sm border border-black/5">
        <p className="text-sm leading-relaxed">{msg.content}</p>

        {hasAiKey && (
          <button
            onClick={() => onAiRefine(msg)}
            disabled={aiLoadingId === msg.id || processingId === msg.id}
            className="absolute -right-3 -bottom-3 size-10 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-amber-500 hover:scale-110 transition-all active:scale-95 disabled:opacity-50 group/btn"
            title="Refinar com IA"
          >
            <span className={`material-symbols-outlined text-[20px] ${aiLoadingId === msg.id ? 'animate-spin' : ''}`}>
              {aiLoadingId === msg.id ? 'sync' : 'auto_awesome'}
            </span>
          </button>
        )}
      </div>
    </div>

    {/* Form */}
    <div className="p-6 flex flex-col justify-between">
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalhes da Venda</h3>
          <p className="text-xs text-slate-500">Confirme os valores e o cliente identificado</p>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Valor total</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">R$</span>
              <input
                className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-sm focus:ring-primary focus:border-primary dark:text-white shadow-sm font-bold"
                type="text"
                placeholder="0,00"
                value={msg.editData.value}
                onChange={(e) => onUpdate(msg.id, 'value', e.target.value)}
              />
            </div>
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
            <input
              className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-sm focus:ring-primary focus:border-primary dark:text-white shadow-sm"
              type="date"
              value={msg.editData.date}
              onChange={(e) => onUpdate(msg.id, 'date', e.target.value)}
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</label>
            <CustomSelect
              value={msg.editData.client_id}
              onChange={(val) => onUpdate(msg.id, 'client_id', val)}
              placeholder="Selecionar Cliente..."
              icon="person"
              options={clients.map((c: any) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Vendedor</label>
            <CustomSelect
              value={msg.editData.seller}
              onChange={(val) => onUpdate(msg.id, 'seller', val)}
              placeholder="Selecione..."
              icon="badge"
              options={sellers.map((s: any) => ({ value: s.name, label: s.name }))}
            />
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Peso (ex: 10g)</label>
            <input
              className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-sm focus:ring-primary focus:border-primary dark:text-white shadow-sm"
              type="text"
              placeholder="0g"
              value={msg.editData.weight}
              onChange={(e) => onUpdate(msg.id, 'weight', e.target.value)}
            />
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Frete (R$)</label>
            <input
              className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-sm focus:ring-primary focus:border-primary dark:text-white shadow-sm"
              type="text"
              placeholder="0,00"
              value={msg.editData.shipping}
              onChange={(e) => onUpdate(msg.id, 'shipping', e.target.value)}
            />
          </div>

        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-[#e7edf3] dark:border-slate-800 pt-4">
        <button
          onClick={() => onReject(msg.id)}
          className="flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          Ignorar
        </button>
        <button
          onClick={() => onApprove(msg)}
          disabled={processingId === msg.id}
          className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
        >
          {processingId === msg.id ? 'Salvando...' : 'Criar Venda'}
        </button>
      </div>
    </div>
  </article>
);

// --- Helpers ---
const parseCurrency = (val: string): number => {
  if (!val) return 0;
  // Remove currency symbols, spaces
  const clean = val.replace(/R\$\s?|[^0-9,.-]/gi, '');
  // If it has a comma and a period, assume period is thousand separator and comma is decimal
  if (clean.includes(',') && clean.includes('.')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  }
  // If it has only a comma, replace with period
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'));
  }
  return parseFloat(clean) || 0;
};

const classifyMessage = (content: string): AutoClassification => {
  const lower = content.toLowerCase();

  // Priority 0: Explicit Labels (Strongest Signal)
  const typeRegex = /tipo:?\s*([a-zA-ZÀ-ÿ]+)/i;
  const typeMatch = lower.match(typeRegex);
  if (typeMatch) {
    const t = typeMatch[1];
    if (t.includes('venda')) return 'sale';
    if (t.includes('recebimento') || t.includes('pagamento') || t.includes('despesa') || t.includes('entrada') || t.includes('saida') || t.includes('saída')) return 'transaction';
  }

  // Priority 1: Payment/receipt keywords = transactions (income)
  const paymentKeywords = ['pagamento recebido', 'pix recebido', 'cliente pagou', 'recebi o pix', 'pagou a venda', 'recebimento de', 'comprovante de pagamento'];
  if (paymentKeywords.some(w => lower.includes(w))) return 'transaction';

  // Priority 2: Sale keywords - broad detection
  const saleKeywords = [
    'venda', 'vendas', 'pedido', 'encomenda', 'cliente', 'comprar',
    'quero', 'gostaria', 'preço', 'quanto', 'gramas', 'gram', 'peso',
    'frete', 'entrega', 'envio', 'joia', 'peça', 'produto'
  ];
  if (saleKeywords.some(w => lower.includes(w))) return 'sale';

  // Priority 3: Transaction keywords
  const transactionKeywords = [
    'paguei', 'pagamento', 'transferência', 'pix', 'boleto', 'conta',
    'recebi', 'recebido', 'nota', 'fatura', 'gasto', 'despesa',
    'depósito', 'depositou', 'transferi'
  ];
  if (transactionKeywords.some(w => lower.includes(w))) return 'transaction';

  // Default: if has currency value, consider as transaction
  if (/r\$\s?\d+/i.test(lower) || /\d+,\d{2}/.test(lower)) return 'transaction';

  return 'discard';
};


const extractFinancialData = (content: string, categories: any[], accounts: any[] = [], clients: any[] = []) => {
  const lower = content?.toLowerCase() || '';

  // Remove date patterns (DD/MM/YYYY or DD-MM-YYYY) to avoid misidentifying day numbers as values
  const contentWithoutDates = content.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, ' [DATE] ');

  let value = '';
  // 1. Try to find value explicitly labeled as "valor"
  const valueLabelRegex = /valor:?\s*(?:r\$?\s*)?(\d+(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
  const labelMatch = contentWithoutDates.match(valueLabelRegex);

  if (labelMatch) {
    value = labelMatch[1];
  } else {
    // 2. Try to find value after currency symbol
    const currencyRegex = /(?:R\$ ?)(\d+(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
    const currencyMatch = contentWithoutDates.match(currencyRegex);
    if (currencyMatch) {
      value = currencyMatch[1];
    } else {
      // 3. Fallback: search for something that looks like a decimal value (X,XX)
      const decimalRegex = /(\d+(?:\.\d{3})*,\d{1,2})/i;
      const decimalMatch = contentWithoutDates.match(decimalRegex);
      if (decimalMatch) value = decimalMatch[1];
    }
  }

  // Weight identification
  let weight = '';
  const weightRegex = /peso:?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:g|gr|gramas)?/i;
  const weightMatch = lower.match(weightRegex);
  if (weightMatch) weight = weightMatch[1];

  // Shipping identification
  let shipping = '';
  const shippingRegex = /frete:?\s*(?:r\$?\s*)?(\d+(?:[.,]\d{1,2})?)/i;
  const shippingMatch = lower.match(shippingRegex);
  if (shippingMatch) shipping = shippingMatch[1];

  // Better income vs expense detection
  // 1. Explicit explicit Type label (e.g. "Tipo: Venda" or "Tipo: Recebimento")
  let type: 'income' | 'expense' = 'income'; // default

  const typeRegex = /tipo:?\s*([a-zA-ZÀ-ÿ]+)/i;
  const typeMatch = lower.match(typeRegex);

  if (typeMatch) {
    const typeValue = typeMatch[1].toLowerCase();
    if (['venda', 'recebimento', 'receita', 'entrada', 'lucro'].some(t => typeValue.includes(t))) {
      type = 'income';
    } else if (['despesa', 'gasto', 'saída', 'saida', 'pagamento', 'compra'].some(t => typeValue.includes(t))) {
      type = 'expense';
    }
  } else {
    // 2. Keyword fallback
    const paymentReceivedKeywords = ['recebi', 'recebido', 'recebimento', 'pix recebido', 'cliente pagou', 'pagou', 'depositou', 'depósito', 'entrada', 'venda'];
    const expenseKeywords = ['paguei', 'pago', 'gasto', 'despesa', 'comprei', 'compra', 'saída', 'transferi'];

    if (expenseKeywords.some(w => lower.includes(w))) {
      type = 'expense';
    } else if (paymentReceivedKeywords.some(w => lower.includes(w))) {
      type = 'income';
    } else {
      type = 'expense'; // Safe default
    }
  }

  let category_id = '';
  const sortedCats = [...categories].sort((a, b) => b.name.length - a.name.length);
  for (const cat of sortedCats) {
    if (lower.includes(cat.name.toLowerCase())) {
      category_id = cat.id;
      break;
    }
  }

  let account_id = '';
  if (accounts.length > 0) {
    const sortedAccs = [...accounts].sort((a, b) => b.name.length - a.name.length);
    for (const acc of sortedAccs) {
      if (lower.includes(acc.name.toLowerCase())) {
        account_id = acc.id;
        break;
      }
    }
  }

  // Client Identification
  let client_id = '';
  if (clients.length > 0) {
    let searchName = '';

    // 1. Try to extract specific client name label
    // Updated Regex: Handles "Cliente: Sara Semijoias Descricao:..." by stopping at keywords
    // Now captures ANY character until a keyword is hit
    const clientNameRegex = /(?:cliente|nome)\s*[:\-]?\s*([^\n\r]+?)(?=\s*(?:descricao|descrição|venda|tipo|valor|data|peso|frete|obs|R\$|$|\n|[,.]))/i;
    const clientMatch = content.match(clientNameRegex);
    if (clientMatch && clientMatch[1]) {
      searchName = clientMatch[1].trim().toLowerCase();

      const matches = clients.filter(c => {
        const cName = c.name?.toLowerCase() || '';
        return cName.includes(searchName) || searchName.includes(cName);
      });

      if (matches.length > 0) {
        matches.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA === searchName) return -1;
          if (nameB === searchName) return 1;
          if (nameA.startsWith(searchName) && !nameB.startsWith(searchName)) return -1;
          if (nameB.startsWith(searchName) && !nameA.startsWith(searchName)) return 1;
          return nameB.length - nameA.length;
        });
        client_id = matches[0].id;
      }
    }

    // 2. If no explicit label found, try to find known client names in the text
    if (!client_id) {
      const cleanLower = lower.replace(/[.,\-]/g, ' ');
      const sortedClients = [...clients].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

      for (const client of sortedClients) {
        if (!client.name || client.name.length < 3) continue;
        const cleanName = client.name.toLowerCase().replace(/[.,\-]/g, ' ');
        if (lower.includes(client.name.toLowerCase()) || cleanLower.includes(cleanName)) {
          client_id = client.id;
          break;
        }
      }
    }
  }

  // Description Identification
  let description = '';
  const descRegex = /(?:descricao|descrição)\s*[:\-]?\s*(.+?)(?=\s*(?:cliente|nome|tipo|valor|data|peso|frete|obs|R\$|$|\n))/i;
  const descMatch = content.match(descRegex);

  if (descMatch && descMatch[1]) {
    description = descMatch[1].trim();
  } else {
    description = type === 'income' ? 'Venda/Recebimento' : 'Pagamento/Despesa';
  }

  return { value, type, category_id, account_id, client_id, weight, shipping, description };
};

// --- Main Component ---
const Review: React.FC = () => {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('transacoes');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]); // New state for sellers
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [autoRefinedIds, setAutoRefinedIds] = useState<Set<string>>(new Set());

  const [isIgnoreModalOpen, setIsIgnoreModalOpen] = useState(false);
  const [ignoreReason, setIgnoreReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [targetIgnoreId, setTargetIgnoreId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const transactionMessages = messages.filter(m => m.classification === 'transaction');
  const saleMessages = messages.filter(m => m.classification === 'sale');
  const discardedMessages = messages.filter(m => m.classification === 'discard');

  let currentList: PendingMessage[] = [];
  if (activeType === 'transacoes') currentList = transactionMessages;
  else if (activeType === 'vendas') currentList = saleMessages;
  else if (activeType === 'lixo') currentList = discardedMessages;

  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  const paginatedList = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: msgs, error: msgsError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .or('status.eq.pending,status.eq.error')
        .order('created_at', { ascending: false });

      if (msgsError) throw msgsError;

      const { data: cats } = await supabase.from('categories').select('*').order('name');
      const { data: accs } = await supabase.from('accounts').select('*');
      const { data: contacts } = await supabase.from('contacts').select('id, phone, name, category, whatsapp_monitoring, photo_url');

      let groupedCats: any[] = [];
      if (cats) {
        const parents = cats.filter(c => !c.parent_id);
        parents.forEach(p => {
          groupedCats.push({ value: p.id, label: p.name, icon: p.icon || 'label' });
          cats.filter(c => c.parent_id === p.id).forEach(sub => {
            groupedCats.push({ value: sub.id, label: `↳ ${sub.name}`, icon: sub.icon || 'subdirectory_arrow_right' });
          });
        });
      }

      setCategories(groupedCats);
      setAccounts(accs || []);

      // Filter sellers
      const sellersList = (contacts || []).filter(c => c.category === 'Vendedor');
      setSellers(sellersList);

      const mappedMsgs: PendingMessage[] = (msgs || []).map(m => {
        // Robust Phone Matching
        const jidRaw = m.remote_jid.split('@')[0].replace(/\D/g, '');
        const jidNormalized = (jidRaw.startsWith('55') && jidRaw.length > 10) ? jidRaw.substring(2) : jidRaw;

        const contact = contacts?.find(c => {
          if (!c.phone) return false;
          const phoneRaw = c.phone.replace(/\D/g, '');
          const phoneNormalized = (phoneRaw.startsWith('55') && phoneRaw.length > 10) ? phoneRaw.substring(2) : phoneRaw;
          return jidNormalized === phoneNormalized || phoneNormalized.endsWith(jidNormalized) || jidNormalized.endsWith(phoneNormalized);
        });

        let classification = classifyMessage(m.content || '');
        if (m.status === 'error') classification = 'discard'; // Keep error messages in discard/error tab
        const extracted = extractFinancialData(m.content || '', cats || [], accs || [], contacts || []);

        // Try to extract date from content (DD/MM/YYYY or DD-MM-YYYY)
        const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;
        const dateMatch = (m.content || '').match(dateRegex);
        let formattedDate = '';

        if (dateMatch) {
          const [_, day, month, year] = dateMatch;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          const msgDate = new Date(m.created_at);
          formattedDate = msgDate.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        }

        return {
          ...m,
          contact_name: contact?.name || 'Desconhecido',
          contact_id: contact?.id,
          contact_avatar: contact?.photo_url || `https://ui-avatars.com/api/?name=${contact?.name || '?'}&background=random`,
          classification,
          editData: {
            value: extracted.value,
            date: formattedDate,
            description: m.content || '',
            category_id: extracted.category_id,
            account_id: extracted.account_id || accs?.[0]?.id || '',
            client_id: extracted.client_id || '', // Only use extracted client from content, never phone sender
            client_name: extracted.client_id ? (clients?.find(c => c.id === extracted.client_id)?.name || 'Desconhecido') : 'Desconhecido',
            type: extracted.type as 'income' | 'expense',
            weight: extracted.weight || '',
            shipping: extracted.shipping || '',
            seller: '' // Initialize seller
          }
        };
      });

      setClients(contacts || []);
      setMessages(mappedMsgs);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('ai_config')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settings?.ai_config) {
          const { groqKey, anthropicKey, openAIKey } = settings.ai_config;
          setApiKey(groqKey || anthropicKey || openAIKey);
        }
      }
    } catch (error) {
      console.error('Error fetching review data:', error);
      toast.error('Erro ao carregar dados de revisão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_messages' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeType, messages.length]);

  // Auto AI Refinement
  useEffect(() => {
    if (!apiKey || loading) return;

    const pendingToRefine = messages.filter(m =>
      m.classification !== 'discard' &&
      m.status === 'pending' &&
      !autoRefinedIds.has(m.id) &&
      !aiLoadingId
    );

    if (pendingToRefine.length > 0) {
      const msg = pendingToRefine[0];
      setAutoRefinedIds(prev => new Set(prev).add(msg.id));
      handleAiRefine(msg);
    }
  }, [messages, apiKey, loading, autoRefinedIds, aiLoadingId]);

  const handleUpdateEditData = (id: string, field: string, value: any) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, editData: { ...m.editData, [field]: value } } : m));
  };

  const handleApproveTransaction = async (msg: PendingMessage) => {
    if (!msg.editData.value || !msg.editData.category_id || !msg.editData.account_id) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    setProcessingId(msg.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: transError } = await supabase.from('transactions').insert({
        user_id: user?.id,
        description: msg.editData.description,
        value: parseCurrency(msg.editData.value),
        type: msg.editData.type,
        date: msg.editData.date,
        category_id: msg.editData.category_id,
        account_id: msg.editData.account_id,
        contact_id: msg.editData.client_id || msg.contact_id,
        status: 'confirmed',
        is_ai: true,
        ai_metadata: { whatsapp_message_id: msg.id, instance: msg.instance_name }
      });
      if (transError) throw transError;

      const { error: msgUpdateError } = await supabase
        .from('whatsapp_messages')
        .update({ status: 'processed' })
        .eq('id', msg.id);

      if (msgUpdateError) throw msgUpdateError;

      toast.success('Transação registrada!');
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch (error) {
      toast.error('Erro ao aprovar transação.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveSale = async (msg: PendingMessage) => {
    if (!msg.editData.client_id) {
      toast.error('Informe o cliente para aprovar a venda.');
      return;
    }
    setProcessingId(msg.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create the Sale
      const cleanWeight = msg.editData.weight ? msg.editData.weight.replace(/[^\d.,]/g, '') : '';

      const salePayload = {
        user_id: user?.id,
        date: msg.editData.date,
        client_id: msg.editData.client_id,
        // account_id removed as it doesn't exist in sales table
        value: parseCurrency(msg.editData.value),
        weight: parseFloat(cleanWeight) || null,
        shipping: parseCurrency(msg.editData.shipping || '0'),
        seller: msg.editData.seller || 'WhatsApp IA', // Use selected seller or default
        code: `WPP-${msg.id.substring(0, 6).toUpperCase()}`
      };

      const { data: newSale, error: saleError } = await supabase.from('sales').insert([salePayload]).select().single();

      if (saleError) {
        console.error('Sale insert error:', saleError);
        throw new Error(`Erro ao criar venda: ${saleError.message}`);
      }

      // 2. Mark message as processed (No transaction created as per user request)
      const { error: msgUpdateError } = await supabase
        .from('whatsapp_messages')
        .update({ status: 'processed' })
        .eq('id', msg.id);

      if (msgUpdateError) throw msgUpdateError;

      toast.success('Venda registrada com sucesso!');
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch (error: any) {
      console.error('Error creating sale and transaction:', error);
      toast.error(error.message || 'Erro ao processar venda.');
    } finally {
      setProcessingId(null);
    }
  };

  const openIgnoreModal = (id: string) => {
    setTargetIgnoreId(id);
    setIgnoreReason('');
    setCustomReason('');
    setIsIgnoreModalOpen(true);
  };

  const confirmReject = async () => {
    if (!targetIgnoreId) return;
    setProcessingId(targetIgnoreId);
    try {
      const finalReason = ignoreReason === 'Outro' ? customReason : ignoreReason;

      // Try with ignore_reason first
      const { error: updateError } = await supabase
        .from('whatsapp_messages')
        .update({
          status: 'error',
          ignore_reason: finalReason || 'Sem motivo informado'
        })
        .eq('id', targetIgnoreId);

      // Fallback: If ignore_reason column doesn't exist, try updating only status
      if (updateError) {
        console.warn('Failed to update with ignore_reason, trying status only:', updateError);
        const { error: fallbackError } = await supabase
          .from('whatsapp_messages')
          .update({ status: 'error' })
          .eq('id', targetIgnoreId);

        if (fallbackError) throw fallbackError;
      }

      toast.success('Mensagem movida para Lixo/Ignorados.');
      setMessages(prev => prev.filter(m => m.id !== targetIgnoreId));
      setIsIgnoreModalOpen(false);
    } catch (error) {
      console.error('Error rejecting message:', error);
      toast.error('Erro ao ignorar mensagem.');
    } finally {
      setProcessingId(null);
      setTargetIgnoreId(null);
    }
  };


  const handleAiRefine = async (msg: PendingMessage) => {
    if (!apiKey) {
      toast.error('Chave de API de IA não configurada.');
      return;
    }
    setAiLoadingId(msg.id);
    try {
      const refined = await extractFinancialDataWithAI(apiKey, msg.content, categories, accounts, clients);
      if (refined) {
        setMessages(prev => prev.map(m => {
          if (m.id === msg.id) {
            return {
              ...m,
              classification: refined.classification,
              editData: {
                ...m.editData,
                value: refined.value || m.editData.value,
                description: refined.description || m.editData.description,
                category_id: refined.category_id || m.editData.category_id,
                client_id: refined.client_id || m.editData.client_id, // AI might find a client
                type: refined.type || m.editData.type,
                weight: refined.weight || m.editData.weight,
                shipping: refined.shipping || m.editData.shipping
              }
            };
          }
          return m;
        }));
        // toast.success('Dados refinados com IA!');
      }
    } catch (error) {
      console.error('AI Refine error:', error);
      // toast.error('Erro ao refinar com IA.');
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ status: 'pending', ignore_reason: null })
        .eq('id', id);

      if (error) throw error;
      toast.success('Mensagem restaurada para revisão.');
      // Refresh to get it back in pending
      fetchData();
    } catch (error) {
      toast.error('Erro ao restaurar mensagem.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearDiscarded = () => {
    setIsClearModalOpen(true);
  };

  const confirmClearDiscarded = async () => {
    if (discardedMessages.length === 0) return;
    setLoading(true);
    try {
      const idsToDelete = discardedMessages.map(m => m.id);
      const { error } = await supabase
        .from('whatsapp_messages')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;
      toast.success('Lixo esvaziado com sucesso!');
      setMessages(prev => prev.filter(m => !idsToDelete.includes(m.id)));
      setIsClearModalOpen(false);
    } catch (error) {
      console.error('Error clearing trash:', error);
      toast.error('Erro ao esvaziar lixo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <PageHeader
        title="Revisão Inteligente"
        description="Analise e confirme as transações identificadas pelo assistente."
        actions={
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm shadow-sm"
          >
            <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Atualizar
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[#e7edf3] dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex min-w-max">
          <button
            onClick={() => setActiveType('transacoes')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeType === 'transacoes' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Transações ({transactionMessages.length})
          </button>
          <button
            onClick={() => setActiveType('vendas')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeType === 'vendas' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Vendas Pendentes ({saleMessages.length})
          </button>
          <button
            onClick={() => setActiveType('lixo')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeType === 'lixo' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Ignorados / Erros ({discardedMessages.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : paginatedList.length === 0 ? (
          <EmptyState message="Nenhuma mensagem pendente nesta categoria." />
        ) : (
          paginatedList.map(msg => (
            activeType === 'transacoes' ? (
              <TransactionReviewCard
                key={msg.id}
                msg={msg}
                categories={categories}
                accounts={accounts}
                clients={clients}
                processingId={processingId}
                aiLoadingId={aiLoadingId}
                hasAiKey={!!apiKey}
                onUpdate={handleUpdateEditData}
                onApprove={handleApproveTransaction}
                onReject={openIgnoreModal}
                onAiRefine={handleAiRefine}
              />
            ) : activeType === 'vendas' ? (
              <SaleReviewCard
                key={msg.id}
                msg={msg}
                categories={categories}
                accounts={accounts}
                clients={clients}
                sellers={sellers}
                processingId={processingId}
                aiLoadingId={aiLoadingId}
                hasAiKey={!!apiKey}
                onUpdate={handleUpdateEditData}
                onApprove={handleApproveSale}
                onReject={openIgnoreModal}
                onAiRefine={handleAiRefine}
              />
            ) : (
              // Discarded / Error View
              <article key={msg.id} className="rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 p-4 flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{msg.contact_name}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{msg.content}</p>
                  <p className="text-xs text-rose-500 font-bold mt-1">Motivo: {msg.ignore_reason || 'Erro no processamento'}</p>
                </div>
                <button
                  onClick={() => handleRestore(msg.id)}
                  className="size-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors shadow-sm"
                  title="Restaurar para revisão"
                >
                  <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
                </button>
              </article>
            )
          ))
        )}
      </div>

      {/* Pagination */}
      {currentList.length > itemsPerPage && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-850 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-sm text-slate-500">Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Clear Trash Action */}
      {activeType === 'lixo' && discardedMessages.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearDiscarded}
            className="text-xs text-rose-500 font-bold hover:underline"
          >
            Esvaziar Lixo
          </button>
        </div>
      )}

      {/* Ignore/Reject Modal */}
      <ConfirmModal
        isOpen={isIgnoreModalOpen}
        title="Ignorar Mensagem"
        message="Selecione o motivo para ignorar esta mensagem:"
        confirmLabel="Confirmar e Ignorar"
        cancelLabel="Cancelar"
        onConfirm={confirmReject}
        onClose={() => setIsIgnoreModalOpen(false)}
        type="danger"
      >
        <div className="mt-4 flex flex-col gap-2">
          {['Não é financeiro', 'Spam / Propaganda', 'Duplicado', 'Erro de interpretação', 'Outro'].map((reason) => (
            <label key={reason} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="ignoreReason"
                value={reason}
                checked={ignoreReason === reason}
                onChange={(e) => setIgnoreReason(e.target.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{reason}</span>
            </label>
          ))}
          {ignoreReason === 'Outro' && (
            <input
              className="mt-2 block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-sm focus:ring-primary focus:border-primary"
              placeholder="Digite o motivo..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}
        </div>
      </ConfirmModal>

      {/* Clear Trash Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Esvaziar Lixo"
        message="Tem certeza que deseja apagar permanentemente todas as mensagens ignoradas? Esta ação não pode ser desfeita."
        confirmLabel="Sim, Esvaziar"
        cancelLabel="Cancelar"
        onConfirm={confirmClearDiscarded}
        onClose={() => setIsClearModalOpen(false)}
        type="danger"
      />
    </div>
  );
};

export default Review;