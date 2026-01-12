
import { Transaction, TransactionStatus, SourceType, BankAccount, Category } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '28 Nov, 14:30',
    description: 'Pagamento Cliente X - NF 1023',
    category: 'Vendas',
    source: SourceType.AI,
    amount: 4500,
    status: TransactionStatus.CONCILIATED,
    confidence: 0.98,
    isAiExtracted: true
  },
  {
    id: '2',
    date: '28 Nov, 10:15',
    description: 'Compra Material Escritório',
    category: 'Despesas Op.',
    source: SourceType.WHATSAPP,
    amount: -230.50,
    status: TransactionStatus.PENDING,
    confidence: 0.75,
    isAiExtracted: true
  },
  {
    id: '3',
    date: '27 Nov, 18:00',
    description: 'Mensalidade Servidor Cloud',
    category: 'Tecnologia',
    source: SourceType.MANUAL,
    amount: -1200.00,
    status: TransactionStatus.CONCILIATED
  },
  {
    id: '4',
    date: '27 Nov, 09:30',
    description: 'Serviço de Consultoria ABC',
    category: 'Serviços',
    source: SourceType.WHATSAPP,
    amount: 8500.00,
    status: TransactionStatus.CONCILIATED,
    confidence: 0.95,
    isAiExtracted: true
  }
];

export const MOCK_ACCOUNTS: BankAccount[] = [
  {
    id: 'nu',
    name: 'Nubank Principal',
    type: 'Conta Corrente',
    balance: 5230.00,
    lastUpdated: 'Atualizado hoje',
    logo: 'Nu',
    color: '#820ad1',
    trend: 2.4
  },
  {
    id: 'itau',
    name: 'Itaú Black',
    type: 'Cartão de Crédito',
    balance: -1200.00,
    lastUpdated: 'Fatura fecha em 5 dias',
    logo: 'It',
    color: '#ec7000'
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    type: 'Investimentos',
    balance: 12000.00,
    lastUpdated: 'Volatilidade alta',
    logo: 'currency_bitcoin',
    color: '#F3BA2F',
    trend: 12.8
  }
];

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'alim',
    name: 'Alimentação',
    subcategories: ['Restaurante', 'Mercado', 'Delivery'],
    budget: 1500,
    spent: 675,
    icon: 'restaurant',
    color: '#f97316'
  },
  {
    id: 'transp',
    name: 'Transporte',
    subcategories: ['Uber/99', 'Combustível'],
    budget: 800,
    spent: 640,
    icon: 'directions_car',
    color: '#3b82f6'
  },
  {
    id: 'morad',
    name: 'Moradia',
    subcategories: ['Aluguel', 'Luz', 'Internet'],
    budget: 2000,
    spent: 2100,
    icon: 'home',
    color: '#6366f1'
  },
  {
    id: 'lazer',
    name: 'Lazer',
    subcategories: ['Cinema'],
    budget: 500,
    spent: 150,
    icon: 'confirmation_number',
    color: '#ec4899'
  }
];
