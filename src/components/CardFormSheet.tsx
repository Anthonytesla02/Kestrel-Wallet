import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import type { CardTheme, CardType, CurrencyCode, WalletCard } from '../types/wallet';
import { CARD_THEME_LIST } from './CardThemeStyles';
import { CardVisual } from './CardVisual';
import {
  detectCardNetwork,
  formatCardNumber,
  formatExpiryInput,
  generateValidCardNumber,
  sanitizeDigits,
  validateCardInput,
} from '../utils/walletLogic';

interface CardFormSheetProps {
  open: boolean;
  editingCard: WalletCard | null;
  defaultCurrency: CurrencyCode;
  onClose: () => void;
  onSave: (cardData: Omit<WalletCard, 'id' | 'createdAt' | 'monthlySpent'> & { id?: string }) => void;
}

export function CardFormSheet({
  open,
  editingCard,
  defaultCurrency,
  onClose,
  onSave,
}: CardFormSheetProps) {
  const [nickname, setNickname] = useState('');
  const [holderName, setHolderName] = useState('ELENA VANCE');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [type, setType] = useState<CardType>('debit');
  const [theme, setTheme] = useState<CardTheme>('arctic-cobalt');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [balance, setBalance] = useState('2500');
  const [creditLimit, setCreditLimit] = useState('8000');
  const [monthlyLimit, setMonthlyLimit] = useState('4000');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editingCard) {
      setNickname(editingCard.nickname);
      setHolderName(editingCard.holderName);
      setCardNumber(formatCardNumber(editingCard.cardNumber));
      setExpiry(editingCard.expiry);
      setCvv(editingCard.cvv);
      setType(editingCard.type);
      setTheme(editingCard.theme);
      setCurrency(editingCard.currency);
      setBalance(String(editingCard.balance));
      setCreditLimit(String(editingCard.creditLimit ?? 8000));
      setMonthlyLimit(String(editingCard.monthlyLimit));
      setIsDefault(editingCard.isDefault);
    } else {
      setNickname('');
      setHolderName('ELENA VANCE');
      setCardNumber('');
      setExpiry('09/29');
      setCvv('');
      setType('debit');
      setTheme('arctic-cobalt');
      setCurrency(defaultCurrency);
      setBalance('2500');
      setCreditLimit('8000');
      setMonthlyLimit('4000');
      setIsDefault(false);
    }
    setErrors({});
  }, [open, editingCard, defaultCurrency]);

  const detectedNetwork = useMemo(() => detectCardNetwork(cardNumber), [cardNumber]);

  const previewCard: WalletCard = useMemo(
    () => ({
      id: editingCard?.id ?? 'preview',
      nickname: nickname.trim() || 'New Card',
      holderName: (holderName.trim() || 'CARDHOLDER NAME').toUpperCase(),
      cardNumber: sanitizeDigits(cardNumber) || '4532000000000000',
      expiry: expiry || 'MM/YY',
      cvv: cvv || '000',
      network: detectedNetwork,
      type,
      theme,
      balance: Number(balance) || 0,
      creditLimit: type === 'credit' ? Number(creditLimit) || 0 : undefined,
      monthlyLimit: Number(monthlyLimit) || 4000,
      monthlySpent: editingCard?.monthlySpent ?? 0,
      currency,
      isFrozen: editingCard?.isFrozen ?? false,
      isDefault,
      createdAt: editingCard?.createdAt ?? new Date().toISOString(),
    }),
    [
      editingCard,
      nickname,
      holderName,
      cardNumber,
      expiry,
      cvv,
      detectedNetwork,
      type,
      theme,
      balance,
      creditLimit,
      monthlyLimit,
      currency,
      isDefault,
    ]
  );

  const handleGenerateTestCard = () => {
    const networks = ['Visa', 'Mastercard', 'Amex'] as const;
    const pick = networks[Math.floor(Math.random() * networks.length)];
    const num = generateValidCardNumber(pick);
    setCardNumber(formatCardNumber(num));
    setCvv(pick === 'Amex' ? '8421' : '419');
    setExpiry('10/29');
    if (!nickname.trim()) {
      setNickname(`${pick} Cool Card`);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.cardNumber;
      delete next.cvv;
      delete next.expiry;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericBalance = Number(balance);
    const numericCreditLimit = type === 'credit' ? Number(creditLimit) : undefined;
    const numericMonthlyLimit = Number(monthlyLimit);

    const validation = validateCardInput({
      nickname,
      holderName,
      cardNumber,
      expiry,
      cvv,
      type,
      balance: numericBalance,
      creditLimit: numericCreditLimit,
      monthlyLimit: numericMonthlyLimit,
    });

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    onSave({
      id: editingCard?.id,
      nickname: nickname.trim(),
      holderName: holderName.trim().toUpperCase(),
      cardNumber: sanitizeDigits(cardNumber),
      expiry: expiry.trim(),
      cvv: sanitizeDigits(cvv),
      network: detectedNetwork,
      type,
      theme,
      balance: Number(numericBalance.toFixed(2)),
      creditLimit: numericCreditLimit ? Number(numericCreditLimit.toFixed(2)) : undefined,
      monthlyLimit: Number(numericMonthlyLimit.toFixed(2)),
      currency,
      isFrozen: editingCard?.isFrozen ?? false,
      isDefault,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-form-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-[#111b2a] rounded-t-3xl sm:rounded-3xl border border-[#dce4ee] dark:border-[#213248] shadow-2xl overflow-hidden"
          >
            {/* Mobile grab handle */}
            <div className="sm:hidden flex justify-center pt-3">
              <span className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce4ee] dark:border-[#213248]">
              <div>
                <h2
                  id="card-form-title"
                  className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]"
                >
                  {editingCard ? 'Edit Card Details' : 'Add New Card'}
                </h2>
                <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc] mt-0.5">
                  {editingCard
                    ? `Updating ${editingCard.nickname} · ${editingCard.network}`
                    : 'Live preview updates as you enter card details'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close card form"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#4a5a70] hover:bg-[#e8eef5] dark:text-[#92a4bc] dark:hover:bg-[#182538] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
              {/* Live card preview */}
              <div className="max-w-sm mx-auto">
                <CardVisual card={previewCard} compact />
              </div>

              {/* Theme picker */}
              <div>
                <span className="block text-xs font-medium text-[#4a5a70] dark:text-[#92a4bc] mb-2">
                  Card Finish
                </span>
                <div className="grid grid-cols-6 gap-2.5">
                  {CARD_THEME_LIST.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      aria-label={`Select ${t.label} finish`}
                      title={t.label}
                      className={`h-11 rounded-xl ${t.swatchClass} transition-transform active:scale-95 ${
                        theme === t.id
                          ? 'ring-2 ring-sky-600 dark:ring-sky-400 ring-offset-2 ring-offset-white dark:ring-offset-[#111b2a]'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="card-nickname"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    Card Nickname
                  </label>
                  <input
                    id="card-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Arctic Everyday"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  {errors.nickname && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.nickname}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="card-holder"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    Cardholder Name
                  </label>
                  <input
                    id="card-holder"
                    type="text"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="ELENA VANCE"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm uppercase text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  {errors.holderName && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.holderName}</p>
                  )}
                </div>
              </div>

              {/* Card number + generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="card-number"
                    className="text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa]"
                  >
                    Card Number ({detectedNetwork})
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateTestCard}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline py-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Fill sample card</span>
                  </button>
                </div>
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4532 8910 4412 7380"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
                {errors.cardNumber && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="card-expiry"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    Expiry
                  </label>
                  <input
                    id="card-expiry"
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  {errors.expiry && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.expiry}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="card-cvv"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    CVV
                  </label>
                  <input
                    id="card-cvv"
                    type="text"
                    inputMode="numeric"
                    value={cvv}
                    onChange={(e) => setCvv(sanitizeDigits(e.target.value).slice(0, 4))}
                    placeholder={detectedNetwork === 'Amex' ? '8921' : '418'}
                    maxLength={4}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  {errors.cvv && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.cvv}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="card-currency"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    Currency
                  </label>
                  <select
                    id="card-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full h-11 px-3 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Card Type Segmented Control */}
              <div>
                <span className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5">
                  Card Type
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#e8eef5] dark:bg-[#182538]">
                  {(['debit', 'virtual', 'credit'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`h-10 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        type === t
                          ? 'bg-white dark:bg-[#111b2a] text-[#0d1726] dark:text-[#f0f5fa] shadow-sm'
                          : 'text-[#4a5a70] dark:text-[#92a4bc] hover:text-[#0d1726]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance & Limits */}
              <div className={`grid gap-4 ${type === 'credit' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
                <div>
                  <label
                    htmlFor="card-balance"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    {type === 'credit' ? 'Current Spent' : 'Balance'}
                  </label>
                  <input
                    id="card-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  {errors.balance && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.balance}</p>
                  )}
                </div>

                {type === 'credit' && (
                  <div>
                    <label
                      htmlFor="card-credit-limit"
                      className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                    >
                      Credit Limit
                    </label>
                    <input
                      id="card-credit-limit"
                      type="number"
                      min="1"
                      step="1"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                    {errors.creditLimit && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        {errors.creditLimit}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="card-monthly-limit"
                    className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                  >
                    Monthly Cap
                  </label>
                  <input
                    id="card-monthly-limit"
                    type="number"
                    min="1"
                    step="1"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa] focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  {errors.monthlyLimit && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                      {errors.monthlyLimit}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-3 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                />
                <span className="text-sm text-[#0d1726] dark:text-[#f0f5fa]">
                  Set as primary card for Tap to Pay
                </span>
              </label>

              <div className="flex items-center gap-3 pt-2 border-t border-[#dce4ee] dark:border-[#213248]">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl border border-[#dce4ee] dark:border-[#213248] text-sm font-semibold text-[#0d1726] dark:text-[#f0f5fa] hover:bg-[#f3f6fa] dark:hover:bg-[#182538] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  {editingCard ? 'Save Changes' : 'Add Card'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
