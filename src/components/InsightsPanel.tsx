import type { CurrencyCode, Transaction, TransactionCategory, WalletCard } from '../types/wallet';
import {
  calculateCategoryBreakdown,
  calculateWalletSummary,
  formatCurrency,
} from '../utils/walletLogic';

interface InsightsPanelProps {
  cards: WalletCard[];
  transactions: Transaction[];
  displayCurrency: CurrencyCode;
}

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Travel: '#0284c7',       // Glacial Sapphire
  Shopping: '#0d9488',     // Cool Teal
  Dining: '#38bdf8',       // Ice Sky
  Subscriptions: '#4f46e5', // Cool Indigo
  Transfers: '#64748b',    // Cool Slate
  Deposits: '#14b8a6',
};

export function InsightsPanel({ cards, transactions, displayCurrency }: InsightsPanelProps) {
  const breakdown = calculateCategoryBreakdown(transactions, displayCurrency);
  const summary = calculateWalletSummary(cards, displayCurrency);
  const totalOutflow = breakdown.reduce((acc, item) => acc + item.amount, 0);

  // Build SVG Donut segments
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <section aria-label="Spending Insights" className="space-y-5">
      <div className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]">
            Spending Breakdown
          </h2>
          <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">
            Categorized outflow across all linked cards
          </p>
        </div>

        {breakdown.length === 0 ? (
          <p className="text-sm text-[#4a5a70] dark:text-[#92a4bc] py-6 text-center">
            Record a payment or transfer to inspect spending categories.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative h-40 w-40 shrink-0 flex items-center justify-center">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  className="text-[#e8eef5] dark:text-[#182538]"
                />
                {breakdown.map((item) => {
                  const slice = (item.amount / totalOutflow) * circumference;
                  const offset = circumference - cumulative;
                  cumulative += slice;
                  return (
                    <circle
                      key={item.category}
                      cx="72"
                      cy="72"
                      r={radius}
                      fill="none"
                      stroke={CATEGORY_COLORS[item.category]}
                      strokeWidth="16"
                      strokeDasharray={`${slice} ${circumference - slice}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div className="absolute text-center">
                <p className="text-[11px] text-[#4a5a70] dark:text-[#92a4bc]">Total Spent</p>
                <p className="font-display text-base font-bold font-mono-tabular text-[#0d1726] dark:text-[#f0f5fa]">
                  {formatCurrency(totalOutflow, displayCurrency, { compact: true })}
                </p>
              </div>
            </div>

            <div className="w-full flex-1 space-y-3">
              {breakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0d1726] dark:text-[#f0f5fa] flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                        aria-hidden="true"
                      />
                      {item.category}
                    </span>
                    <span className="font-mono-tabular text-[#4a5a70] dark:text-[#92a4bc]">
                      {formatCurrency(item.amount, displayCurrency)} · {item.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#e8eef5] dark:bg-[#182538] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[item.category],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Per-Card Limit & Credit Utilization */}
      <div className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]">
              Card Limits &amp; Utilization
            </h3>
            <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">
              Monthly cap tracking across {cards.length} cards
            </p>
          </div>
          {summary.totalCreditLimit > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-[#4a5a70] dark:text-[#92a4bc]">Credit Utilization</p>
              <p className="font-mono-tabular text-sm font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                {Math.round((summary.totalCreditDebt / summary.totalCreditLimit) * 100)}%
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3.5">
          {cards.map((card) => {
            const pct = Math.min(100, Math.round((card.monthlySpent / card.monthlyLimit) * 100));
            return (
              <div key={card.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0d1726] dark:text-[#f0f5fa]">
                    {card.nickname}{' '}
                    <span className="font-normal text-[#4a5a70] dark:text-[#92a4bc]">
                      · •••• {card.cardNumber.slice(-4)}
                    </span>
                  </span>
                  <span className="font-mono-tabular text-[#4a5a70] dark:text-[#92a4bc]">
                    {formatCurrency(card.monthlySpent, card.currency)} /{' '}
                    {formatCurrency(card.monthlyLimit, card.currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#e8eef5] dark:bg-[#182538] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pct >= 85 ? 'bg-rose-500' : 'bg-sky-600 dark:bg-sky-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
