import type {
  CardNetwork,
  CurrencyCode,
  SavingsVault,
  Transaction,
  TransactionCategory,
  WalletCard,
} from '../types/wallet';

const FX_RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 1.09,
  GBP: 1.27,
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const inUsd = amount * FX_RATES_TO_USD[from];
  return Number((inUsd / FX_RATES_TO_USD[to]).toFixed(2));
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  options?: { compact?: boolean; showSign?: boolean }
): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: options?.compact && abs >= 10000 ? 'compact' : 'standard',
    minimumFractionDigits: options?.compact && abs >= 10000 ? 1 : 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (options?.showSign) {
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
  } else if (amount < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function sanitizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

export function detectCardNetwork(cardNumber: string): CardNetwork {
  const digits = sanitizeDigits(cardNumber);
  if (!digits) return 'Other';
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
  return 'Other';
}

export function formatCardNumber(raw: string): string {
  const digits = sanitizeDigits(raw).slice(0, 19);
  const network = detectCardNetwork(digits);
  if (network === 'Amex') {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function maskCardNumber(cardNumber: string): string {
  const digits = sanitizeDigits(cardNumber);
  if (digits.length < 4) return '••••';
  const last4 = digits.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function validateLuhn(cardNumber: string): boolean {
  const digits = sanitizeDigits(cardNumber);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function generateValidCardNumber(network: CardNetwork = 'Visa'): string {
  const prefixes: Record<CardNetwork, string> = {
    Visa: '4532',
    Mastercard: '5412',
    Amex: '3782',
    Discover: '6011',
    Other: '4916',
  };
  const targetLen = network === 'Amex' ? 15 : 16;
  let base = prefixes[network];
  while (base.length < targetLen - 1) {
    base += Math.floor(Math.random() * 10).toString();
  }
  for (let check = 0; check <= 9; check++) {
    const candidate = `${base}${check}`;
    if (validateLuhn(candidate)) {
      return candidate;
    }
  }
  return `${base}0`;
}

export function formatExpiryInput(raw: string): string {
  const digits = sanitizeDigits(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateExpiry(expiry: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export interface CardFormInput {
  nickname: string;
  holderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  type: WalletCard['type'];
  balance: number;
  creditLimit?: number;
  monthlyLimit: number;
}

export function validateCardInput(
  input: CardFormInput,
  now: Date = new Date()
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.nickname.trim()) {
    errors.nickname = 'Enter a card nickname';
  }
  if (input.holderName.trim().length < 2) {
    errors.holderName = 'Enter the cardholder name';
  }
  const digits = sanitizeDigits(input.cardNumber);
  if (!validateLuhn(digits)) {
    errors.cardNumber = 'Enter a valid 13–19 digit card number';
  }
  if (!validateExpiry(input.expiry, now)) {
    errors.expiry = 'Enter a valid future MM/YY expiry';
  }
  const network = detectCardNetwork(digits);
  const expectedCvvLen = network === 'Amex' ? 4 : 3;
  const cvvDigits = sanitizeDigits(input.cvv);
  if (cvvDigits.length < 3 || cvvDigits.length > 4 || (network === 'Amex' && cvvDigits.length !== 4)) {
    errors.cvv = `Enter a ${expectedCvvLen}-digit security code`;
  }
  if (Number.isNaN(input.balance) || input.balance < 0) {
    errors.balance = 'Amount cannot be negative';
  }
  if (input.type === 'credit') {
    if (!input.creditLimit || input.creditLimit <= 0) {
      errors.creditLimit = 'Credit limit must be greater than zero';
    } else if (input.balance > input.creditLimit) {
      errors.balance = 'Spent balance cannot exceed credit limit';
    }
  }
  if (Number.isNaN(input.monthlyLimit) || input.monthlyLimit <= 0) {
    errors.monthlyLimit = 'Monthly limit must be greater than zero';
  }
  return errors;
}

export interface WalletSummary {
  totalAvailable: number;
  totalCreditDebt: number;
  totalCreditLimit: number;
  totalMonthlySpent: number;
  activeCardsCount: number;
  frozenCardsCount: number;
}

export function calculateWalletSummary(
  cards: WalletCard[],
  displayCurrency: CurrencyCode
): WalletSummary {
  let totalAvailable = 0;
  let totalCreditDebt = 0;
  let totalCreditLimit = 0;
  let totalMonthlySpent = 0;
  let frozenCardsCount = 0;

  for (const card of cards) {
    if (card.isFrozen) frozenCardsCount++;
    const spentConverted = convertCurrency(card.monthlySpent, card.currency, displayCurrency);
    totalMonthlySpent += spentConverted;

    if (card.type === 'credit') {
      const debt = convertCurrency(card.balance, card.currency, displayCurrency);
      const limit = convertCurrency(card.creditLimit ?? 0, card.currency, displayCurrency);
      totalCreditDebt += debt;
      totalCreditLimit += limit;
      totalAvailable += Math.max(0, limit - debt);
    } else {
      totalAvailable += convertCurrency(card.balance, card.currency, displayCurrency);
    }
  }

  return {
    totalAvailable: Number(totalAvailable.toFixed(2)),
    totalCreditDebt: Number(totalCreditDebt.toFixed(2)),
    totalCreditLimit: Number(totalCreditLimit.toFixed(2)),
    totalMonthlySpent: Number(totalMonthlySpent.toFixed(2)),
    activeCardsCount: cards.length - frozenCardsCount,
    frozenCardsCount,
  };
}

export function getCardAvailableFunds(card: WalletCard): number {
  if (card.type === 'credit') {
    return Math.max(0, (card.creditLimit ?? 0) - card.balance);
  }
  return card.balance;
}

export type CardActionKind = 'pay' | 'send' | 'topup';

export interface TransactionExecutionResult {
  ok: boolean;
  error?: string;
  cards: WalletCard[];
  transaction?: Transaction;
}

export function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KW-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function executeCardTransaction(
  cards: WalletCard[],
  params: {
    cardId: string;
    amount: number;
    kind: CardActionKind;
    merchant: string;
    category: TransactionCategory;
    note?: string;
    date?: string;
  }
): TransactionExecutionResult {
  const { cardId, amount, kind, merchant, category, note, date } = params;
  const target = cards.find((c) => c.id === cardId);

  if (!target) {
    return { ok: false, error: 'Selected card could not be found.', cards };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Enter an amount greater than zero.', cards };
  }
  if (target.isFrozen) {
    return {
      ok: false,
      error: `${target.nickname} is currently frozen. Unfreeze it to continue.`,
      cards,
    };
  }
  if (!merchant.trim()) {
    return { ok: false, error: 'Enter a merchant or recipient name.', cards };
  }

  const roundedAmount = Number(amount.toFixed(2));

  if (kind === 'topup') {
    const updatedCards = cards.map((card) => {
      if (card.id !== cardId) return card;
      if (card.type === 'credit') {
        return {
          ...card,
          balance: Number(Math.max(0, card.balance - roundedAmount).toFixed(2)),
        };
      }
      return {
        ...card,
        balance: Number((card.balance + roundedAmount).toFixed(2)),
      };
    });

    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cardId,
      merchant: merchant.trim(),
      category: 'Deposits',
      amount: roundedAmount,
      currency: target.currency,
      direction: 'credit',
      date: date ?? new Date().toISOString(),
      note: note?.trim() || undefined,
      referenceCode: generateReferenceCode(),
    };

    return { ok: true, cards: updatedCards, transaction: tx };
  }

  const available = getCardAvailableFunds(target);
  if (roundedAmount > available) {
    return {
      ok: false,
      error: `Insufficient available funds (${formatCurrency(available, target.currency)} available).`,
      cards,
    };
  }

  if (target.monthlySpent + roundedAmount > target.monthlyLimit) {
    const remainingLimit = Math.max(0, target.monthlyLimit - target.monthlySpent);
    return {
      ok: false,
      error: `Exceeds monthly card limit (${formatCurrency(remainingLimit, target.currency)} remaining).`,
      cards,
    };
  }

  const updatedCards = cards.map((card) => {
    if (card.id !== cardId) return card;
    const nextBalance =
      card.type === 'credit'
        ? Number((card.balance + roundedAmount).toFixed(2))
        : Number((card.balance - roundedAmount).toFixed(2));
    return {
      ...card,
      balance: nextBalance,
      monthlySpent: Number((card.monthlySpent + roundedAmount).toFixed(2)),
    };
  });

  const tx: Transaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cardId,
    merchant: merchant.trim(),
    category,
    amount: roundedAmount,
    currency: target.currency,
    direction: 'debit',
    date: date ?? new Date().toISOString(),
    note: note?.trim() || undefined,
    referenceCode: generateReferenceCode(),
  };

  return { ok: true, cards: updatedCards, transaction: tx };
}

export function filterTransactions(
  transactions: Transaction[],
  filters: {
    cardId?: string | 'all';
    category?: TransactionCategory | 'All';
    query?: string;
  }
): Transaction[] {
  const q = (filters.query ?? '').trim().toLowerCase();
  return transactions
    .filter((tx) => {
      if (filters.cardId && filters.cardId !== 'all' && tx.cardId !== filters.cardId) {
        return false;
      }
      if (filters.category && filters.category !== 'All' && tx.category !== filters.category) {
        return false;
      }
      if (q) {
        const hay = `${tx.merchant} ${tx.category} ${tx.note ?? ''} ${tx.referenceCode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export interface CategoryBreakdownItem {
  category: TransactionCategory;
  amount: number;
  percentage: number;
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  displayCurrency: CurrencyCode
): CategoryBreakdownItem[] {
  const totals = new Map<TransactionCategory, number>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.direction !== 'debit') continue;
    const converted = convertCurrency(tx.amount, tx.currency, displayCurrency);
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + converted);
    grandTotal += converted;
  }

  if (grandTotal <= 0) return [];

  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: Math.round((amount / grandTotal) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface VaultTransferResult {
  ok: boolean;
  error?: string;
  cards: WalletCard[];
  vaults: SavingsVault[];
  transaction?: Transaction;
}

export function executeVaultTransfer(
  cards: WalletCard[],
  vaults: SavingsVault[],
  params: {
    vaultId: string;
    cardId: string;
    amount: number;
    direction: 'deposit' | 'withdraw';
  }
): VaultTransferResult {
  const { vaultId, cardId, amount, direction } = params;
  const vault = vaults.find((v) => v.id === vaultId);
  const card = cards.find((c) => c.id === cardId);

  if (!vault || !card) {
    return { ok: false, error: 'Select a valid vault and card.', cards, vaults };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Enter an amount greater than zero.', cards, vaults };
  }
  if (card.isFrozen) {
    return {
      ok: false,
      error: `${card.nickname} is frozen. Unfreeze it to transfer funds.`,
      cards,
      vaults,
    };
  }

  const rounded = Number(amount.toFixed(2));
  const amountInCardCurrency = convertCurrency(rounded, vault.currency, card.currency);

  if (direction === 'deposit') {
    if (card.type === 'credit') {
      return {
        ok: false,
        error: 'Vault contributions must use a debit or virtual card.',
        cards,
        vaults,
      };
    }
    if (amountInCardCurrency > card.balance) {
      return {
        ok: false,
        error: `Insufficient funds on ${card.nickname}.`,
        cards,
        vaults,
      };
    }
    const nextCards = cards.map((c) =>
      c.id === cardId ? { ...c, balance: Number((c.balance - amountInCardCurrency).toFixed(2)) } : c
    );
    const nextVaults = vaults.map((v) =>
      v.id === vaultId ? { ...v, currentAmount: Number((v.currentAmount + rounded).toFixed(2)) } : v
    );
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cardId,
      merchant: `Vault · ${vault.name}`,
      category: 'Transfers',
      amount: amountInCardCurrency,
      currency: card.currency,
      direction: 'debit',
      date: new Date().toISOString(),
      note: 'Savings vault contribution',
      referenceCode: generateReferenceCode(),
    };
    return { ok: true, cards: nextCards, vaults: nextVaults, transaction: tx };
  }

  if (rounded > vault.currentAmount) {
    return {
      ok: false,
      error: `Cannot withdraw more than ${formatCurrency(vault.currentAmount, vault.currency)}.`,
      cards,
      vaults,
    };
  }
  const nextVaults = vaults.map((v) =>
    v.id === vaultId ? { ...v, currentAmount: Number((v.currentAmount - rounded).toFixed(2)) } : v
  );
  const nextCards = cards.map((c) => {
    if (c.id !== cardId) return c;
    if (c.type === 'credit') {
      return {
        ...c,
        balance: Number(Math.max(0, c.balance - amountInCardCurrency).toFixed(2)),
      };
    }
    return { ...c, balance: Number((c.balance + amountInCardCurrency).toFixed(2)) };
  });
  const tx: Transaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cardId,
    merchant: `Vault · ${vault.name}`,
    category: 'Deposits',
    amount: amountInCardCurrency,
    currency: card.currency,
    direction: 'credit',
    date: new Date().toISOString(),
    note: 'Vault withdrawal to card',
    referenceCode: generateReferenceCode(),
  };
  return { ok: true, cards: nextCards, vaults: nextVaults, transaction: tx };
}
