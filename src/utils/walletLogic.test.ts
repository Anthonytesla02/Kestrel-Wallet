import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCategoryBreakdown,
  calculateWalletSummary,
  detectCardNetwork,
  executeCardTransaction,
  executeVaultTransfer,
  filterTransactions,
  formatCardNumber,
  generateValidCardNumber,
  maskCardNumber,
  validateCardInput,
  validateExpiry,
  validateLuhn,
} from './walletLogic';
import type { SavingsVault, Transaction, WalletCard } from '../types/wallet';

const sampleCards: WalletCard[] = [
  {
    id: 'card-1',
    nickname: 'Arctic Everyday',
    holderName: 'Elena Vance',
    cardNumber: '4532891044127380',
    expiry: '08/29',
    cvv: '418',
    network: 'Visa',
    type: 'debit',
    theme: 'arctic-cobalt',
    balance: 2400,
    monthlyLimit: 3000,
    monthlySpent: 650,
    currency: 'USD',
    isFrozen: false,
    isDefault: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'card-2',
    nickname: 'Titanium Reserve',
    holderName: 'Elena Vance',
    cardNumber: '378282246310005',
    expiry: '11/28',
    cvv: '8921',
    network: 'Amex',
    type: 'credit',
    theme: 'frosted-titanium',
    balance: 1200,
    creditLimit: 8000,
    monthlyLimit: 5000,
    monthlySpent: 1200,
    currency: 'USD',
    isFrozen: false,
    isDefault: false,
    createdAt: '2026-02-14T10:00:00.000Z',
  },
];

test('detectCardNetwork and formatting handle Visa, Mastercard, and Amex', () => {
  assert.equal(detectCardNetwork('4532891044127380'), 'Visa');
  assert.equal(detectCardNetwork('5412751234123452'), 'Mastercard');
  assert.equal(detectCardNetwork('378282246310005'), 'Amex');
  assert.equal(formatCardNumber('378282246310005'), '3782 822463 10005');
  assert.equal(formatCardNumber('4532891044127380'), '4532 8910 4412 7380');
  assert.equal(maskCardNumber('4532891044127380'), '•••• •••• •••• 7380');
});

test('validateLuhn validates standard numbers and generated numbers', () => {
  assert.equal(validateLuhn('4532891044127380'), true);
  assert.equal(validateLuhn('5412751234123452'), true);
  assert.equal(validateLuhn('378282246310005'), true);
  assert.equal(validateLuhn('4532891044127381'), false);

  for (const net of ['Visa', 'Mastercard', 'Amex', 'Discover'] as const) {
    const generated = generateValidCardNumber(net);
    assert.equal(validateLuhn(generated), true);
    assert.equal(detectCardNetwork(generated), net);
  }
});

test('validateExpiry checks future MM/YY relative to reference date', () => {
  const ref = new Date('2026-11-15T00:00:00Z');
  assert.equal(validateExpiry('11/26', ref), true);
  assert.equal(validateExpiry('10/26', ref), false);
  assert.equal(validateExpiry('13/28', ref), false);
  assert.equal(validateExpiry('04/30', ref), true);
});

test('validateCardInput returns field-specific errors for invalid data', () => {
  const ref = new Date('2026-11-15T00:00:00Z');
  const errors = validateCardInput(
    {
      nickname: '',
      holderName: 'A',
      cardNumber: '1234',
      expiry: '01/20',
      cvv: '12',
      type: 'credit',
      balance: 500,
      creditLimit: 200,
      monthlyLimit: 0,
    },
    ref
  );
  assert.ok(errors.nickname);
  assert.ok(errors.holderName);
  assert.ok(errors.cardNumber);
  assert.ok(errors.expiry);
  assert.ok(errors.cvv);
  assert.ok(errors.balance);
  assert.ok(errors.monthlyLimit);
});

test('calculateWalletSummary aggregates available funds, credit debt, and spend', () => {
  const summary = calculateWalletSummary(sampleCards, 'USD');
  assert.equal(summary.totalAvailable, 9200); // 2400 debit + (8000 - 1200) credit available
  assert.equal(summary.totalCreditDebt, 1200);
  assert.equal(summary.totalCreditLimit, 8000);
  assert.equal(summary.totalMonthlySpent, 1850);
  assert.equal(summary.activeCardsCount, 2);
});

test('executeCardTransaction enforces frozen status, balance, limits, and updates balances', () => {
  const payRes = executeCardTransaction(sampleCards, {
    cardId: 'card-1',
    amount: 150,
    kind: 'pay',
    merchant: 'Blue Bottle Coffee',
    category: 'Dining',
  });
  assert.equal(payRes.ok, true);
  assert.equal(payRes.cards[0].balance, 2250);
  assert.equal(payRes.cards[0].monthlySpent, 800);
  assert.equal(payRes.transaction?.direction, 'debit');

  // Top up reduces credit card debt
  const topUpRes = executeCardTransaction(payRes.cards, {
    cardId: 'card-2',
    amount: 300,
    kind: 'topup',
    merchant: 'Statement Payment',
    category: 'Deposits',
  });
  assert.equal(topUpRes.ok, true);
  assert.equal(topUpRes.cards[1].balance, 900);

  // Frozen card rejects payment
  const frozenCards = sampleCards.map((c, idx) => (idx === 0 ? { ...c, isFrozen: true } : c));
  const frozenRes = executeCardTransaction(frozenCards, {
    cardId: 'card-1',
    amount: 20,
    kind: 'pay',
    merchant: 'Transit',
    category: 'Travel',
  });
  assert.equal(frozenRes.ok, false);
  assert.match(frozenRes.error ?? '', /frozen/i);

  // Over monthly limit rejects payment
  const overLimitRes = executeCardTransaction(sampleCards, {
    cardId: 'card-1',
    amount: 2400,
    kind: 'pay',
    merchant: 'Apple Store',
    category: 'Shopping',
  });
  assert.equal(overLimitRes.ok, false);
});

test('filterTransactions and calculateCategoryBreakdown compute accurate analytics', () => {
  const txs: Transaction[] = [
    {
      id: 't1',
      cardId: 'card-1',
      merchant: 'Nordstrom',
      category: 'Shopping',
      amount: 300,
      currency: 'USD',
      direction: 'debit',
      date: '2026-11-20T12:00:00Z',
      referenceCode: 'KW-111111',
    },
    {
      id: 't2',
      cardId: 'card-2',
      merchant: 'Delta Air Lines',
      category: 'Travel',
      amount: 700,
      currency: 'USD',
      direction: 'debit',
      date: '2026-11-21T12:00:00Z',
      referenceCode: 'KW-222222',
    },
    {
      id: 't3',
      cardId: 'card-1',
      merchant: 'Payroll Deposit',
      category: 'Deposits',
      amount: 2000,
      currency: 'USD',
      direction: 'credit',
      date: '2026-11-22T12:00:00Z',
      referenceCode: 'KW-333333',
    },
  ];

  assert.equal(filterTransactions(txs, { cardId: 'card-1' }).length, 2);
  assert.equal(filterTransactions(txs, { query: 'delta' }).length, 1);

  const breakdown = calculateCategoryBreakdown(txs, 'USD');
  assert.equal(breakdown.length, 2);
  assert.equal(breakdown[0].category, 'Travel');
  assert.equal(breakdown[0].percentage, 70);
  assert.equal(breakdown[1].category, 'Shopping');
  assert.equal(breakdown[1].percentage, 30);
});

test('executeVaultTransfer handles deposits and withdrawals safely', () => {
  const vaults: SavingsVault[] = [
    {
      id: 'v1',
      name: 'Kyoto Reserve',
      targetAmount: 5000,
      currentAmount: 1000,
      currency: 'USD',
      accentTone: 'sapphire',
    },
  ];

  const dep = executeVaultTransfer(sampleCards, vaults, {
    vaultId: 'v1',
    cardId: 'card-1',
    amount: 400,
    direction: 'deposit',
  });
  assert.equal(dep.ok, true);
  assert.equal(dep.cards[0].balance, 2000);
  assert.equal(dep.vaults[0].currentAmount, 1400);

  const withdrawTooMuch = executeVaultTransfer(dep.cards, dep.vaults, {
    vaultId: 'v1',
    cardId: 'card-1',
    amount: 2000,
    direction: 'withdraw',
  });
  assert.equal(withdrawTooMuch.ok, false);
});
