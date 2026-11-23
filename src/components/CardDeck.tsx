import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Layers,
  LayoutGrid,
  Pencil,
  Plus,
  RotateCw,
  Snowflake,
  Star,
  Trash2,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';
import type { CurrencyCode, WalletCard } from '../types/wallet';
import type { CardActionKind } from '../utils/walletLogic';
import { formatCurrency, getCardAvailableFunds } from '../utils/walletLogic';
import { CardVisual } from './CardVisual';

interface CardDeckProps {
  cards: WalletCard[];
  selectedCardId: string | null;
  displayCurrency: CurrencyCode;
  onSelectCard: (cardId: string) => void;
  onAddCard: () => void;
  onEditCard: (card: WalletCard) => void;
  onDeleteCard: (card: WalletCard) => void;
  onToggleFreeze: (cardId: string) => void;
  onSetDefault: (cardId: string) => void;
  onStartAction: (kind: CardActionKind, card: WalletCard) => void;
}

export function CardDeck({
  cards,
  selectedCardId,
  displayCurrency,
  onSelectCard,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onToggleFreeze,
  onSetDefault,
  onStartAction,
}: CardDeckProps) {
  const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const selectedIndex = Math.max(
    0,
    cards.findIndex((c) => c.id === selectedCardId)
  );
  const activeCard = cards[selectedIndex] ?? null;

  const handlePrev = () => {
    if (cards.length < 2) return;
    const prevIdx = (selectedIndex - 1 + cards.length) % cards.length;
    setFlippedCardId(null);
    onSelectCard(cards[prevIdx].id);
  };

  const handleNext = () => {
    if (cards.length < 2) return;
    const nextIdx = (selectedIndex + 1) % cards.length;
    setFlippedCardId(null);
    onSelectCard(cards[nextIdx].id);
  };

  if (cards.length === 0) {
    return (
      <section className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-[#e8eef5] dark:bg-[#182538] text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
          <CreditCard className="h-7 w-7" />
        </div>
        <h2 className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa] mt-4">
          Your wallet has no cards yet
        </h2>
        <p className="text-sm text-[#4a5a70] dark:text-[#92a4bc] max-w-sm mx-auto mt-1.5">
          Add a debit, credit, or virtual card to unlock contactless tap-to-pay, instant transfers,
          and spending limits.
        </p>
        <button
          type="button"
          onClick={onAddCard}
          className="mt-5 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Your First Card</span>
        </button>
      </section>
    );
  }

  const spendPct = activeCard
    ? Math.min(100, Math.round((activeCard.monthlySpent / activeCard.monthlyLimit) * 100))
    : 0;

  return (
    <section aria-label="Payment Cards" className="space-y-5">
      {/* Header row with view switcher & Add Card */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]">
            My Cards
          </h2>
          <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} in wallet
            {activeCard ? ` · Selected: ${activeCard.nickname}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center p-1 rounded-xl bg-[#e8eef5] dark:bg-[#182538]"
            role="group"
            aria-label="Card display layout"
          >
            <button
              type="button"
              onClick={() => setViewMode('deck')}
              aria-label="Deck view"
              aria-pressed={viewMode === 'deck'}
              className={`min-h-[36px] min-w-[36px] px-2.5 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'deck'
                  ? 'bg-white dark:bg-[#111b2a] text-[#0d1726] dark:text-[#f0f5fa] shadow-xs'
                  : 'text-[#4a5a70] dark:text-[#92a4bc]'
              }`}
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`min-h-[36px] min-w-[36px] px-2.5 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#111b2a] text-[#0d1726] dark:text-[#f0f5fa] shadow-xs'
                  : 'text-[#4a5a70] dark:text-[#92a4bc]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onAddCard}
            className="h-11 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {viewMode === 'deck' && activeCard ? (
        <div className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-3.5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Interactive Stacked Deck Area */}
          <div className="relative max-w-md mx-auto pt-2 sm:pt-3 pb-0.5">
            {/* Stacked card shadows underneath */}
            {cards.length > 1 && (
              <div
                aria-hidden="true"
                className="absolute inset-x-5 top-0 h-8 rounded-t-2xl bg-[#dbe4f0] dark:bg-[#1d2d44] opacity-75 transition-all"
              />
            )}
            {cards.length > 2 && (
              <div
                aria-hidden="true"
                className="absolute inset-x-9 -top-2 h-8 rounded-t-2xl bg-[#e8eef5] dark:bg-[#162336] opacity-70"
              />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10"
              >
                <CardVisual
                  card={activeCard}
                  displayCurrency={displayCurrency}
                  isFlipped={flippedCardId === activeCard.id}
                  onFlipToggle={() =>
                    setFlippedCardId((prev) => (prev === activeCard.id ? null : activeCard.id))
                  }
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Card selector controls */}
          {cards.length > 1 && (
            <div className="flex items-center justify-between max-w-md mx-auto">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous card"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] flex items-center justify-center text-[#0d1726] dark:text-[#f0f5fa] transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2" role="tablist" aria-label="Select card">
                {cards.map((c) => {
                  const isCurrent = c.id === activeCard.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      aria-label={`Select ${c.nickname}`}
                      onClick={() => {
                        setFlippedCardId(null);
                        onSelectCard(c.id);
                      }}
                      className={`h-2.5 rounded-full transition-all ${
                        isCurrent
                          ? 'w-7 bg-sky-600 dark:bg-sky-400'
                          : 'w-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                      }`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next card"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] flex items-center justify-center text-[#0d1726] dark:text-[#f0f5fa] transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Primary Payment Actions (Thumb friendly) */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => onStartAction('pay', activeCard)}
              className="h-14 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-[0.98]"
            >
              <Wifi className="h-4 w-4 rotate-90" />
              <span className="text-xs font-semibold">Tap to Pay</span>
            </button>

            <button
              type="button"
              onClick={() => onStartAction('send', activeCard)}
              className="h-14 rounded-2xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-[#0d1726] dark:text-[#f0f5fa] border border-[#dce4ee] dark:border-[#213248] flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-[0.98]"
            >
              <ArrowUpRight className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-semibold">Send</span>
            </button>

            <button
              type="button"
              onClick={() => onStartAction('topup', activeCard)}
              className="h-14 rounded-2xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-[#0d1726] dark:text-[#f0f5fa] border border-[#dce4ee] dark:border-[#213248] flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-[0.98]"
            >
              <ArrowDownLeft className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold">
                {activeCard.type === 'credit' ? 'Pay Card' : 'Top Up'}
              </span>
            </button>
          </div>

          {/* Monthly Limit Progress + Card Management Controls */}
          <div className="pt-4 border-t border-[#dce4ee] dark:border-[#213248] space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-[#4a5a70] dark:text-[#92a4bc]">
                  Monthly Spend Limit
                </span>
                <span className="font-mono-tabular font-semibold text-[#0d1726] dark:text-[#f0f5fa]">
                  {formatCurrency(activeCard.monthlySpent, activeCard.currency)} /{' '}
                  {formatCurrency(activeCard.monthlyLimit, activeCard.currency)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#e8eef5] dark:bg-[#182538] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    spendPct >= 90 ? 'bg-rose-500' : 'bg-sky-600 dark:bg-sky-400'
                  }`}
                  style={{ width: `${spendPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFlippedCardId((prev) => (prev === activeCard.id ? null : activeCard.id))
                  }
                  className="h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>{flippedCardId === activeCard.id ? 'Show Front' : 'Details & CVV'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFreeze(activeCard.id)}
                  aria-pressed={activeCard.isFrozen}
                  className={`h-11 px-3.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                    activeCard.isFrozen
                      ? 'bg-sky-600 text-white hover:bg-sky-700'
                      : 'bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-[#0d1726] dark:text-[#f0f5fa]'
                  }`}
                >
                  <Snowflake className="h-3.5 w-3.5" />
                  <span>{activeCard.isFrozen ? 'Unfreeze' : 'Freeze'}</span>
                </button>

                {!activeCard.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(activeCard.id)}
                    className="h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Star className="h-3.5 w-3.5" />
                    <span>Set Primary</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditCard(activeCard)}
                  aria-label={`Edit ${activeCard.nickname}`}
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCard(activeCard)}
                  aria-label={`Delete ${activeCard.nickname}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Grid / All Cards view */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => {
            const isSelected = card.id === activeCard?.id;
            return (
              <div
                key={card.id}
                className={`rounded-3xl bg-white dark:bg-[#111b2a] p-4 border transition-all ${
                  isSelected
                    ? 'border-sky-600 dark:border-sky-400 ring-2 ring-sky-500/20'
                    : 'border-[#dce4ee] dark:border-[#213248]'
                }`}
              >
                <CardVisual
                  card={card}
                  displayCurrency={displayCurrency}
                  isFlipped={flippedCardId === card.id}
                  onFlipToggle={() => {
                    onSelectCard(card.id);
                    setFlippedCardId((prev) => (prev === card.id ? null : card.id));
                  }}
                  compact
                />
                <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#4a5a70] dark:text-[#92a4bc] truncate">
                      {card.type === 'credit' ? 'Available Credit' : 'Balance'} ·{' '}
                      <span className="font-mono-tabular font-semibold text-[#0d1726] dark:text-[#f0f5fa]">
                        {formatCurrency(getCardAvailableFunds(card), card.currency)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCard(card.id);
                        setViewMode('deck');
                      }}
                      className="h-10 px-3 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-[#f3f6fa] dark:hover:bg-[#182538]"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditCard(card)}
                      aria-label={`Edit ${card.nickname}`}
                      className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#4a5a70] hover:bg-[#f3f6fa] dark:text-[#92a4bc] dark:hover:bg-[#182538]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCard(card)}
                      aria-label={`Delete ${card.nickname}`}
                      className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
