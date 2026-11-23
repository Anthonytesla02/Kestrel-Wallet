export type CardNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Other';

export type CardType = 'debit' | 'credit' | 'virtual';

export type CardTheme =
  | 'arctic-cobalt'
  | 'glacial-teal'
  | 'frosted-titanium'
  | 'deep-slate'
  | 'midnight-indigo'
  | 'nordic-mist';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export type TransactionCategory =
  | 'Shopping'
  | 'Dining'
  | 'Travel'
  | 'Transfers'
  | 'Deposits'
  | 'Subscriptions';

export type TransactionDirection = 'debit' | 'credit';

export interface WalletCard {
  id: string;
  nickname: string;
  holderName: string;
  cardNumber: string; // digits only (13-19)
  expiry: string; // MM/YY
  cvv: string; // 3-4 digits
  network: CardNetwork;
  type: CardType;
  theme: CardTheme;
  balance: number; // available balance for debit/virtual, or current spent balance for credit
  creditLimit?: number; // only for credit cards
  monthlyLimit: number;
  monthlySpent: number;
  currency: CurrencyCode;
  isFrozen: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  merchant: string;
  category: TransactionCategory;
  amount: number; // always positive
  currency: CurrencyCode;
  direction: TransactionDirection;
  date: string; // ISO string
  note?: string;
  referenceCode: string;
}

export interface SavingsVault {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  accentTone: 'sapphire' | 'teal' | 'indigo' | 'slate';
  targetDate?: string;
}

export interface QuickContact {
  id: string;
  name: string;
  handle: string;
  initials: string;
}

export type ActiveTab = 'wallet' | 'activity' | 'vaults' | 'insights';
