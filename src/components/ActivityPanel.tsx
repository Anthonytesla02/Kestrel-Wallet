import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  Coffee,
  Plane,
  Receipt,
  Repeat,
  Search,
  Send,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import type { Transaction, TransactionCategory, WalletCard } from '../types/wallet';
import { filterTransactions, formatCurrency } from '../utils/walletLogic';

interface ActivityPanelProps {
  transactions: Transaction[];
  cards: WalletCard[];
  selectedCardId?: string | 'all';
  compact?: boolean;
  hideBalances?: boolean;
  onDeleteTransaction?: (txId: string) => void;
  onViewAll?: () => void;
}

const CATEGORIES: Array<TransactionCategory | 'All'> = [
  'All',
  'Dining',
  'Shopping',
  'Travel',
  'Transfers',
  'Subscriptions',
  'Deposits',
];

function CategoryIcon({ category }: { category: TransactionCategory }) {
  switch (category) {
    case 'Dining':
      return <Coffee className="h-4 w-4" />;
    case 'Shopping':
      return <ShoppingBag className="h-4 w-4" />;
    case 'Travel':
      return <Plane className="h-4 w-4" />;
    case 'Transfers':
      return <Send className="h-4 w-4" />;
    case 'Deposits':
      return <ArrowDownLeft className="h-4 w-4" />;
    case 'Subscriptions':
      return <Repeat className="h-4 w-4" />;
  }
}

function formatTxDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

export function ActivityPanel({
  transactions,
  cards,
  selectedCardId = 'all',
  compact = false,
  hideBalances = false,
  onDeleteTransaction,
  onViewAll,
}: ActivityPanelProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'All'>('All');
  const [cardFilter, setCardFilter] = useState<string | 'all'>(selectedCardId);
  const [inspectedTx, setInspectedTx] = useState<Transaction | null>(null);

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const filtered = useMemo(() => {
    const items = filterTransactions(transactions, {
      cardId: compact ? 'all' : cardFilter,
      category: compact ? 'All' : categoryFilter,
      query: compact ? '' : query,
    });
    return compact ? items.slice(0, 5) : items;
  }, [transactions, compact, cardFilter, categoryFilter, query]);

  return (
    <section
      aria-label="Transaction Activity"
      className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]">
            {compact ? 'Recent Activity' : 'Activity Ledger'}
          </h2>
          <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">
            {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        {compact && onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="h-10 px-3 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-[#f3f6fa] dark:hover:bg-[#182538] transition-colors whitespace-nowrap"
          >
            View All
          </button>
        )}
      </div>

      {!compact && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search
                className="h-4 w-4 text-[#4a5a70] dark:text-[#92a4bc] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search transactions"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search merchant, note, or reference"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <select
              aria-label="Filter by card"
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              <option value="all">All Cards</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname} (•••• {c.cardNumber.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
            role="tablist"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategoryFilter(cat)}
                  className={`h-9 px-3.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-sky-600 text-white'
                      : 'bg-[#f3f6fa] dark:bg-[#182538] text-[#4a5a70] dark:text-[#92a4bc] hover:text-[#0d1726] dark:hover:text-[#f0f5fa]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <Receipt className="h-8 w-8 text-[#4a5a70] dark:text-[#92a4bc] mx-auto opacity-60" />
          <p className="text-sm font-medium text-[#0d1726] dark:text-[#f0f5fa] mt-2">
            No matching transactions
          </p>
          <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc] mt-1">
            Try clearing your filters or record a new payment.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#dce4ee] dark:divide-[#213248]">
          {filtered.map((tx) => {
            const card = cardMap.get(tx.cardId);
            const isCredit = tx.direction === 'credit';
            return (
              <li key={tx.id}>
                <button
                  type="button"
                  onClick={() => setInspectedTx(tx)}
                  className="w-full min-h-[60px] py-3 px-1 flex items-center justify-between gap-3 text-left hover:bg-[#f3f6fa]/70 dark:hover:bg-[#182538]/60 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'bg-[#e8eef5] dark:bg-[#182538] text-[#0d1726] dark:text-[#f0f5fa]'
                      }`}
                    >
                      <CategoryIcon category={tx.category} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0d1726] dark:text-[#f0f5fa] truncate">
                        {tx.merchant}
                      </p>
                      <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc] truncate mt-0.5">
                        {tx.category} · {formatTxDate(tx.date)}
                        {card ? ` · ${card.nickname}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono-tabular text-sm font-semibold ${
                        isCredit
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-[#0d1726] dark:text-[#f0f5fa]'
                      }`}
                    >
                      {hideBalances
                        ? '•••••'
                        : formatCurrency(isCredit ? tx.amount : -tx.amount, tx.currency, {
                            showSign: true,
                          })}
                    </p>
                    <p className="font-mono-tabular text-[11px] text-[#4a5a70] dark:text-[#92a4bc]">
                      {tx.referenceCode}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Receipt Inspection Modal */}
      {inspectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-title"
        >
          <div
            onClick={() => setInspectedTx(null)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-[#111b2a] rounded-t-3xl sm:rounded-3xl border border-[#dce4ee] dark:border-[#213248] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3
                id="receipt-title"
                className="font-display text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]"
              >
                Transaction Receipt
              </h3>
              <button
                type="button"
                onClick={() => setInspectedTx(null)}
                aria-label="Close receipt"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#4a5a70] hover:bg-[#f3f6fa] dark:text-[#92a4bc] dark:hover:bg-[#182538]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-3 border-y border-[#dce4ee] dark:border-[#213248] text-center">
              <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">{inspectedTx.merchant}</p>
              <p className="font-display text-3xl font-bold font-mono-tabular text-[#0d1726] dark:text-[#f0f5fa] mt-1">
                {formatCurrency(
                  inspectedTx.direction === 'credit' ? inspectedTx.amount : -inspectedTx.amount,
                  inspectedTx.currency,
                  { showSign: true }
                )}
              </p>
            </div>

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#4a5a70] dark:text-[#92a4bc]">Category</dt>
                <dd className="font-medium text-[#0d1726] dark:text-[#f0f5fa]">
                  {inspectedTx.category}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#4a5a70] dark:text-[#92a4bc]">Card</dt>
                <dd className="font-medium text-[#0d1726] dark:text-[#f0f5fa]">
                  {cardMap.get(inspectedTx.cardId)?.nickname ?? 'Removed Card'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#4a5a70] dark:text-[#92a4bc]">Date</dt>
                <dd className="font-mono-tabular text-[#0d1726] dark:text-[#f0f5fa]">
                  {new Date(inspectedTx.date).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#4a5a70] dark:text-[#92a4bc]">Reference</dt>
                <dd className="font-mono-tabular text-[#0d1726] dark:text-[#f0f5fa]">
                  {inspectedTx.referenceCode}
                </dd>
              </div>
              {inspectedTx.note && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#4a5a70] dark:text-[#92a4bc]">Note</dt>
                  <dd className="text-right text-[#0d1726] dark:text-[#f0f5fa]">
                    {inspectedTx.note}
                  </dd>
                </div>
              )}
            </dl>

            {onDeleteTransaction && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(inspectedTx.id);
                  setInspectedTx(null);
                }}
                className="w-full h-11 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Ledger Entry</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
