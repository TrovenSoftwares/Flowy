
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  CONCILIATED = 'conciliado',
  PENDING = 'pendente',
  REJECTED = 'rejeitado',
}

export enum SourceType {
  AI = 'AI Auto',
  MANUAL = 'Manual',
  WHATSAPP = 'WhatsApp IA',
  RECURRING = 'Recorrente',
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  source: SourceType;
  amount: number;
  status: TransactionStatus;
  confidence?: number;
  details?: string;
  isAiExtracted?: boolean;
}

export interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  lastUpdated: string;
  logo: string;
  color: string;
  trend?: number;
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
  budget: number;
  spent: number;
  icon: string;
  color: string;
}
