import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Wifi, X } from 'lucide-react';
import type { TransactionCategory, WalletCard } from '../types/wallet';
import { QUICK_CONTACTS } from '../data/seedData';
import type { CardActionKind } from '../utils/walletLogic';
import { formatCurrency, getCardAvailableFunds } from '../utils/walletLogic';

interface PaymentActionSheetProps {
  open: boolean;
  kind: CardActionKind;
  cards: WalletCard[];
  initialCardId: string | null;
  onClose: () => void;
  onExecute: (payload: {
    cardId: string;
    amount: number;
    kind: CardActionKind;
    merchant: string;
    category: TransactionCategory;
    note?: string;
  }) => { ok: boolean; error?: string; referenceCode?: string };
}

const MERCHANT_PRESETS: Array<{ name: string; category: TransactionCategory; amount: string }> = [
  { name: 'Blue Bottle Coffee', category: 'Dining', amount: '12.50' },
  { name: 'City Metro Pass', category: 'Travel', amount: '34.00' },
  { name: 'Whole Foods Market', category: 'Shopping', amount: '68.40' },
];

export function PaymentActionSheet({
  open,
  kind,
  cards,
  initialCardId,
  onClose,
  onExecute,
}: PaymentActionSheetProps) {
  const [cardId, setCardId] = useState(initialCardId ?? cards[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Shopping');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [nfcScanning, setNfcScanning] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCardId(initialCardId ?? cards[0]?.id ?? '');
    setAmount(kind === 'pay' ? '24.50' : kind === 'send' ? '50.00' : '250.00');
    setMerchant(
      kind === 'pay'
        ? 'Blue Bottle Coffee'
        : kind === 'send'
        ? QUICK_CONTACTS[0].name
        : 'Bank Transfer Top-Up'
    );
    setCategory(kind === 'send' ? 'Transfers' : kind === 'topup' ? 'Deposits' : 'Dining');
    setNote('');
    setError('');
    setNfcScanning(false);
    setSuccessRef(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, initialCardId]);

  const selectedCard = cards.find((c) => c.id === cardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = Number(amount);

    if (kind === 'pay') {
      setNfcScanning(true);
      setTimeout(() => {
        const res = onExecute({
          cardId,
          amount: numAmount,
          kind,
          merchant,
          category,
          note,
        });
        setNfcScanning(false);
        if (!res.ok) {
          setError(res.error ?? 'Could not complete payment.');
        } else {
          setSuccessRef(res.referenceCode ?? 'KW-DONE');
        }
      }, 650);
      return;
    }

    const res = onExecute({
      cardId,
      amount: numAmount,
      kind,
      merchant,
      category,
      note,
    });
    if (!res.ok) {
      setError(res.error ?? 'Transaction failed.');
    } else {
      setSuccessRef(res.referenceCode ?? 'KW-DONE');
    }
  };

  const title =
    kind === 'pay'
      ? 'Contactless Tap to Pay'
      : kind === 'send'
      ? 'Send Money'
      : selectedCard?.type === 'credit'
      ? 'Pay Card Statement'
      : 'Top Up Card';

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-sheet-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 36, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#111b2a] rounded-t-3xl sm:rounded-3xl border border-[#dce4ee] dark:border-[#213248] shadow-2xl overflow-hidden"
          >
            <div className="sm:hidden flex justify-center pt-3">
              <span className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce4ee] dark:border-[#213248]">
              <h2
                id="action-sheet-title"
                className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close payment sheet"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#4a5a70] hover:bg-[#f3f6fa] dark:text-[#92a4bc] dark:hover:bg-[#182538]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successRef ? (
              <div className="p-6 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="h-14 w-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="h-8 w-8" />
                </motion.div>
                <div>
                  <p className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                    {kind === 'topup' ? 'Funds Applied' : 'Transaction Confirmed'}
                  </p>
                  <p className="text-sm text-[#4a5a70] dark:text-[#92a4bc] mt-1">
                    {formatCurrency(Number(amount), selectedCard?.currency ?? 'USD')} · {merchant}
                  </p>
                  <p className="font-mono-tabular text-xs text-[#4a5a70] dark:text-[#92a4bc] mt-2">
                    Reference {successRef}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            ) : nfcScanning ? (
              <div className="p-8 text-center space-y-5">
                <div className="relative h-24 w-24 mx-auto flex items-center justify-center">
                  <motion.span
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-sky-500"
                  />
                  <motion.span
                    animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
                    transition={{ duration: 0.9, delay: 0.25, repeat: Infinity }}
                    className="absolute inset-2 rounded-full border-2 border-sky-400"
                  />
                  <div className="h-14 w-14 rounded-full bg-sky-600 text-white flex items-center justify-center relative z-10">
                    <Wifi className="h-6 w-6 rotate-90" />
                  </div>
                </div>
                <div>
                  <p className="font-display text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                    Authorizing Contactless Terminal…
                  </p>
                  <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc] mt-1">
                    {selectedCard?.nickname} ·{' '}
                    {formatCurrency(Number(amount) || 0, selectedCard?.currency ?? 'USD')}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="action-card-select"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    Card
                  </label>
                  <select
                    id="action-card-select"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nickname} (•••• {c.cardNumber.slice(-4)}) ·{' '}
                        {formatCurrency(getCardAvailableFunds(c), c.currency)}
                        {c.isFrozen ? ' [Frozen]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {kind === 'pay' && (
                  <div>
                    <span className="block text-xs font-medium text-[#4a5a70] dark:text-[#92a4bc] mb-1.5">
                      Quick Terminal Presets
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {MERCHANT_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setMerchant(preset.name);
                            setCategory(preset.category);
                            setAmount(preset.amount);
                          }}
                          className="p-2 rounded-xl border border-[#dce4ee] dark:border-[#213248] hover:border-sky-500 text-left transition-colors"
                        >
                          <p className="text-[11px] font-semibold text-[#0d1726] dark:text-[#f0f5fa] truncate">
                            {preset.name}
                          </p>
                          <p className="font-mono-tabular text-[11px] text-[#4a5a70] dark:text-[#92a4bc]">
                            ${preset.amount}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {kind === 'send' && (
                  <div>
                    <span className="block text-xs font-medium text-[#4a5a70] dark:text-[#92a4bc] mb-1.5">
                      Quick Contacts
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_CONTACTS.map((contact) => {
                        const active = merchant === contact.name;
                        return (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => setMerchant(contact.name)}
                            className={`p-2 rounded-xl border text-center transition-colors ${
                              active
                                ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/50'
                                : 'border-[#dce4ee] dark:border-[#213248] hover:bg-[#f3f6fa] dark:hover:bg-[#182538]'
                            }`}
                          >
                            <span className="h-8 w-8 rounded-full bg-[#e8eef5] dark:bg-[#182538] text-xs font-bold text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center justify-center">
                              {contact.initials}
                            </span>
                            <p className="text-[11px] font-medium text-[#0d1726] dark:text-[#f0f5fa] truncate mt-1">
                              {contact.name.split(' ')[0]}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="action-merchant"
                      className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                    >
                      {kind === 'send' ? 'Recipient' : kind === 'topup' ? 'Source' : 'Merchant'}
                    </label>
                    <input
                      id="action-merchant"
                      type="text"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="action-amount"
                      className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                    >
                      Amount ({selectedCard?.currency ?? 'USD'})
                    </label>
                    <input
                      id="action-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                {kind === 'pay' && (
                  <div>
                    <label
                      htmlFor="action-category"
                      className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                    >
                      Category
                    </label>
                    <select
                      id="action-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="Dining">Dining</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Travel">Travel</option>
                      <option value="Subscriptions">Subscriptions</option>
                      <option value="Transfers">Transfers</option>
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="action-note"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    Note (optional)
                  </label>
                  <input
                    id="action-note"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add memo or reference"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 rounded-xl">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
                >
                  {kind === 'pay'
                    ? 'Hold Near Reader & Pay'
                    : kind === 'send'
                    ? 'Send Instant Transfer'
                    : 'Confirm Deposit'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
