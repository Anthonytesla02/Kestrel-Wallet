import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  Lock,
  Moon,
  PiggyBank,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import type {
  ActiveTab,
  CurrencyCode,
  SavingsVault,
  Transaction,
  TransactionCategory,
  WalletCard,
} from './types/wallet';
import {
  INITIAL_CARDS,
  INITIAL_TRANSACTIONS,
  INITIAL_VAULTS,
  USER_PROFILE,
} from './data/seedData';
import {
  calculateWalletSummary,
  executeCardTransaction,
  executeVaultTransfer,
  formatCurrency,
  type CardActionKind,
} from './utils/walletLogic';
import { CardDeck } from './components/CardDeck';
import { CardFormSheet } from './components/CardFormSheet';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PaymentActionSheet } from './components/PaymentActionSheet';
import { ActivityPanel } from './components/ActivityPanel';
import { VaultsPanel } from './components/VaultsPanel';
import { InsightsPanel } from './components/InsightsPanel';
import { BiometricLockScreen } from './components/BiometricLockScreen';
import { WalletSkeleton } from './components/WalletSkeleton';
import { CardAddedCelebration } from './components/CardAddedCelebration';
import { SplashScreen } from './components/SplashScreen';
import { KestrelLogo } from './components/KestrelLogo';
import { shouldShowSplash, shouldStartLocked } from './utils/biometricLogic';

const STORAGE_KEY = 'kestrel_wallet_v1';

interface PersistedWalletState {
  cards: WalletCard[];
  transactions: Transaction[];
  vaults: SavingsVault[];
  selectedCardId: string | null;
  displayCurrency: CurrencyCode;
  darkMode: boolean;
  hideBalances: boolean;
}

function loadInitialState(): PersistedWalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedWalletState>;
      if (Array.isArray(parsed.cards) && Array.isArray(parsed.transactions) && Array.isArray(parsed.vaults)) {
        return {
          cards: parsed.cards,
          transactions: parsed.transactions,
          vaults: parsed.vaults,
          selectedCardId: parsed.selectedCardId ?? parsed.cards[0]?.id ?? null,
          displayCurrency: parsed.displayCurrency ?? 'USD',
          darkMode: Boolean(parsed.darkMode),
          hideBalances: Boolean(parsed.hideBalances),
        };
      }
    }
  } catch {
    // Fall back to deterministic seed state
  }
  return {
    cards: INITIAL_CARDS,
    transactions: INITIAL_TRANSACTIONS,
    vaults: INITIAL_VAULTS,
    selectedCardId: INITIAL_CARDS[0].id,
    displayCurrency: 'USD',
    darkMode: false,
    hideBalances: false,
  };
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string; icon: typeof Wallet }> = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'vaults', label: 'Vaults', icon: PiggyBank },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
];

export default function App() {
  const [initial] = useState<PersistedWalletState>(() => loadInitialState());
  const [cards, setCards] = useState<WalletCard[]>(initial.cards);
  const [transactions, setTransactions] = useState<Transaction[]>(initial.transactions);
  const [vaults, setVaults] = useState<SavingsVault[]>(initial.vaults);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(initial.selectedCardId);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(initial.displayCurrency);
  const [darkMode, setDarkMode] = useState<boolean>(initial.darkMode);
  const [hideBalances, setHideBalances] = useState<boolean>(initial.hideBalances);

  const [activeTab, setActiveTab] = useState<ActiveTab>('wallet');
  const [showSplash, setShowSplash] = useState<boolean>(() =>
    typeof window !== 'undefined' ? shouldShowSplash(window.location.search) : true
  );
  const [splashExited, setSplashExited] = useState<boolean>(() =>
    typeof window !== 'undefined' ? !shouldShowSplash(window.location.search) : false
  );
  const [isLocked, setIsLocked] = useState<boolean>(() =>
    typeof window !== 'undefined' ? shouldStartLocked(window.location.search) : true
  );
  const [isHydrating, setIsHydrating] = useState<boolean>(false);
  const hydrateTimerRef = useRef<number | null>(null);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<WalletCard | null>(null);
  const [recentlyAddedCard, setRecentlyAddedCard] = useState<WalletCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<WalletCard | null>(null);
  const [actionSheet, setActionSheet] = useState<{
    open: boolean;
    kind: CardActionKind;
    cardId: string | null;
  }>({ open: false, kind: 'pay', cardId: null });
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [toast, setToast] = useState<{ message: string; undoCard?: WalletCard } | null>(null);

  const triggerHydration = useCallback((durationMs = 520) => {
    if (hydrateTimerRef.current) {
      window.clearTimeout(hydrateTimerRef.current);
    }
    setIsHydrating(true);
    hydrateTimerRef.current = window.setTimeout(() => {
      setIsHydrating(false);
      hydrateTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (hydrateTimerRef.current) {
        window.clearTimeout(hydrateTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    try {
      const payload: PersistedWalletState = {
        cards,
        transactions,
        vaults,
        selectedCardId,
        displayCurrency,
        darkMode,
        hideBalances,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [cards, transactions, vaults, selectedCardId, displayCurrency, darkMode, hideBalances]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const summary = useMemo(
    () => calculateWalletSummary(cards, displayCurrency),
    [cards, displayCurrency]
  );

  const totalVaultBalance = useMemo(
    () => vaults.reduce((sum, v) => sum + v.currentAmount, 0),
    [vaults]
  );

  const handleSaveCard = (
    cardData: Omit<WalletCard, 'id' | 'createdAt' | 'monthlySpent'> & { id?: string }
  ) => {
    if (cardData.id) {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === cardData.id) {
            return {
              ...c,
              ...cardData,
              id: c.id,
            };
          }
          return cardData.isDefault ? { ...c, isDefault: false } : c;
        })
      );
      setToast({ message: `Updated ${cardData.nickname}` });
    } else {
      const newCard: WalletCard = {
        ...cardData,
        id: `card-${Date.now()}`,
        monthlySpent: 0,
        createdAt: new Date().toISOString(),
      };
      setCards((prev) => {
        const base = newCard.isDefault ? prev.map((c) => ({ ...c, isDefault: false })) : prev;
        return [newCard, ...base];
      });
      setSelectedCardId(newCard.id);
      setRecentlyAddedCard(newCard);
    }
    setCardFormOpen(false);
    setEditingCard(null);
  };

  const handleConfirmDeleteCard = (cardId: string) => {
    const removed = cards.find((c) => c.id === cardId);
    const remaining = cards.filter((c) => c.id !== cardId);
    if (removed?.isDefault && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    setCards(remaining);
    if (selectedCardId === cardId) {
      setSelectedCardId(remaining[0]?.id ?? null);
    }
    setCardToDelete(null);
    if (removed) {
      setToast({ message: `Removed ${removed.nickname}`, undoCard: removed });
    }
  };

  const handleUndoDelete = (card: WalletCard) => {
    setCards((prev) => [card, ...prev]);
    setSelectedCardId(card.id);
    setToast({ message: `Restored ${card.nickname}` });
  };

  const handleToggleFreeze = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFrozen: !c.isFrozen } : c))
    );
    if (target) {
      setToast({
        message: target.isFrozen
          ? `${target.nickname} unfrozen`
          : `${target.nickname} frozen`,
      });
    }
  };

  const handleSetDefault = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === cardId })));
    if (target) {
      setToast({ message: `${target.nickname} set as primary card` });
    }
  };

  const handleExecuteAction = (payload: {
    cardId: string;
    amount: number;
    kind: CardActionKind;
    merchant: string;
    category: TransactionCategory;
    note?: string;
  }) => {
    const result = executeCardTransaction(cards, payload);
    if (!result.ok || !result.transaction) {
      return { ok: false, error: result.error };
    }
    setCards(result.cards);
    setTransactions((prev) => [result.transaction!, ...prev]);
    return { ok: true, referenceCode: result.transaction.referenceCode };
  };

  const handleCreateVault = (vaultInput: Omit<SavingsVault, 'id'>) => {
    const newVault: SavingsVault = {
      ...vaultInput,
      id: `vault-${Date.now()}`,
    };
    setVaults((prev) => [newVault, ...prev]);
    setToast({ message: `Created vault "${newVault.name}"` });
  };

  const handleDeleteVault = (vaultId: string) => {
    setVaults((prev) => prev.filter((v) => v.id !== vaultId));
    setToast({ message: 'Removed savings vault' });
  };

  const handleVaultTransfer = (params: {
    vaultId: string;
    cardId: string;
    amount: number;
    direction: 'deposit' | 'withdraw';
  }) => {
    const res = executeVaultTransfer(cards, vaults, params);
    if (!res.ok) return { ok: false, error: res.error };
    setCards(res.cards);
    setVaults(res.vaults);
    if (res.transaction) {
      setTransactions((prev) => [res.transaction!, ...prev]);
    }
    setToast({
      message:
        params.direction === 'deposit'
          ? 'Transferred funds to vault'
          : 'Withdrew funds to card',
    });
    return { ok: true };
  };

  const handleResetDemo = () => {
    setCards(INITIAL_CARDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setVaults(INITIAL_VAULTS);
    setSelectedCardId(INITIAL_CARDS[0].id);
    setDisplayCurrency('USD');
    setProfileOpen(false);
    setToast({ message: 'Restored sample wallet data' });
  };

  return (
    <div className="min-h-screen bg-[#f3f6fa] dark:bg-[#09101a] text-[#0d1726] dark:text-[#f0f5fa] transition-colors">
      <div
        aria-hidden={isLocked}
        className={`transition-all duration-300 ${
          isLocked ? 'blur-md pointer-events-none select-none overflow-hidden max-h-screen' : ''
        }`}
      >
      {/* Top Navigation Bar — Strictly 3 Zones with safe-area padding outside fixed inner bar */}
      <header className="sticky top-0 z-30 pt-safe bg-white/90 dark:bg-[#111b2a]/90 backdrop-blur-xl border-b border-[#dce4ee] dark:border-[#213248]">
        <div className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className="font-display text-lg font-extrabold tracking-tight text-[#0d1726] dark:text-[#f0f5fa] whitespace-nowrap shrink-0 flex items-center gap-2.5 active:scale-[0.97] transition-transform"
          >
            <KestrelLogo className="h-8 w-8 shadow-xs shadow-sky-600/20 rounded-lg" />
            <span>Kestrel</span>
          </button>

          {/* Zone 2: Desktop Single-Line Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    active
                      ? 'border-sky-600 dark:border-sky-400 text-[#0d1726] dark:text-[#f0f5fa]'
                      : 'border-transparent text-[#4a5a70] dark:text-[#92a4bc] hover:text-[#0d1726] dark:hover:text-[#f0f5fa]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Account Trigger */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open wallet preferences and profile"
              className="h-10 pl-1.5 pr-2.5 sm:pr-3 rounded-full bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] hover:bg-[#e8eef5] dark:hover:bg-[#213248] flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0"
            >
              {!avatarFailed ? (
                <img
                  src={USER_PROFILE.avatarUrl}
                  alt={USER_PROFILE.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="h-7 w-7 rounded-full object-cover border border-white/60 dark:border-slate-700"
                />
              ) : (
                <span className="h-7 w-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                  EV
                </span>
              )}
              <span className="text-xs sm:text-sm font-semibold text-[#0d1726] dark:text-[#f0f5fa]">
                {USER_PROFILE.name.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-3.5 sm:pt-7 pb-28 md:pb-12 space-y-4 sm:space-y-6">
        {isHydrating ? (
          <WalletSkeleton />
        ) : (
          <>
            {/* Hero Wallet Balance Summary Strip */}
            <section
              aria-label="Wallet Summary"
              className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-4 sm:p-6 shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-[#4a5a70] dark:text-[#92a4bc]">
                      Total Available Balance · {summary.activeCardsCount} active{' '}
                      {summary.activeCardsCount === 1 ? 'card' : 'cards'}
                      {summary.frozenCardsCount > 0 ? ` · ${summary.frozenCardsCount} frozen` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <h1
                      data-testid="total-balance-amount"
                      className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight font-mono-tabular text-[#0d1726] dark:text-[#f0f5fa]"
                    >
                      {hideBalances
                        ? '••••••'
                        : formatCurrency(summary.totalAvailable, displayCurrency)}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setHideBalances((prev) => !prev)}
                      aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
                      aria-pressed={hideBalances}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-[#4a5a70] dark:text-[#92a4bc] flex items-center justify-center transition-all active:scale-95 shrink-0"
                    >
                      {hideBalances ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc] font-mono-tabular mt-0.5">
                    {hideBalances
                      ? '•••• in vaults'
                      : `${formatCurrency(totalVaultBalance, displayCurrency)} in vaults`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#dce4ee]/70 dark:border-[#213248]/70">
                  {/* Key KPI stats */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 sm:pr-2">
                    <div>
                      <p className="text-[11px] text-[#4a5a70] dark:text-[#92a4bc]">Monthly Spend</p>
                      <p className="font-mono-tabular text-sm sm:text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                        {hideBalances
                          ? '••••'
                          : formatCurrency(summary.totalMonthlySpent, displayCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#4a5a70] dark:text-[#92a4bc]">Credit Used</p>
                      <p className="font-mono-tabular text-sm sm:text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                        {hideBalances
                          ? '••••'
                          : formatCurrency(summary.totalCreditDebt, displayCurrency)}
                      </p>
                    </div>
                  </div>

                  {/* Workspace controls: Currency + Refresh + Theme */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <div
                      className="flex items-center p-1 rounded-xl bg-[#e8eef5] dark:bg-[#182538]"
                      role="group"
                      aria-label="Display currency"
                    >
                      {(['USD', 'EUR', 'GBP'] as const).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setDisplayCurrency(curr)}
                          aria-pressed={displayCurrency === curr}
                          className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                            displayCurrency === curr
                              ? 'bg-white dark:bg-[#111b2a] text-[#0d1726] dark:text-[#f0f5fa] shadow-xs'
                              : 'text-[#4a5a70] dark:text-[#92a4bc]'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHydration(520);
                        }}
                        aria-label="Refresh wallet balances"
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-[#e8eef5] dark:bg-[#182538] text-[#0d1726] dark:text-[#f0f5fa] flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDarkMode((prev) => !prev)}
                        aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                        className="min-h-[44px] min-w-[44px] rounded-xl bg-[#e8eef5] dark:bg-[#182538] text-[#0d1726] dark:text-[#f0f5fa] flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
                      >
                        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tabbed Content Views with Smooth Transitions */}
            <AnimatePresence mode="wait">
              {activeTab === 'wallet' && (
                <motion.div
                  key="tab-wallet"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  <div className="lg:col-span-7 space-y-6">
                    <CardDeck
                      cards={cards}
                      selectedCardId={selectedCardId}
                      displayCurrency={displayCurrency}
                      hideBalances={hideBalances}
                      onSelectCard={setSelectedCardId}
                      onAddCard={() => {
                        setEditingCard(null);
                        setCardFormOpen(true);
                      }}
                      onEditCard={(card) => {
                        setEditingCard(card);
                        setCardFormOpen(true);
                      }}
                      onDeleteCard={(card) => setCardToDelete(card)}
                      onToggleFreeze={handleToggleFreeze}
                      onSetDefault={handleSetDefault}
                      onStartAction={(kind, card) =>
                        setActionSheet({ open: true, kind, cardId: card.id })
                      }
                    />
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <ActivityPanel
                      transactions={transactions}
                      cards={cards}
                      compact
                      hideBalances={hideBalances}
                      onDeleteTransaction={(txId) =>
                        setTransactions((prev) => prev.filter((t) => t.id !== txId))
                      }
                      onViewAll={() => setActiveTab('activity')}
                    />

                    {/* Compact Savings Vaults Preview */}
                    <section
                      aria-label="Savings Vaults Summary"
                      className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="font-display text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                            Savings Vaults
                          </h2>
                          <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">
                            {vaults.length} active reserves ·{' '}
                            <span className="font-mono-tabular font-medium text-[#0d1726] dark:text-[#f0f5fa]">
                              {hideBalances
                                ? '••••'
                                : formatCurrency(totalVaultBalance, displayCurrency)}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('vaults')}
                          className="h-10 px-3 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-[#f3f6fa] dark:hover:bg-[#182538] transition-colors whitespace-nowrap"
                        >
                          Manage
                        </button>
                      </div>

                      <div className="space-y-3">
                        {vaults.slice(0, 2).map((vault) => {
                          const pct = Math.min(
                            100,
                            Math.round((vault.currentAmount / vault.targetAmount) * 100)
                          );
                          return (
                            <div key={vault.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-[#0d1726] dark:text-[#f0f5fa]">
                                  {vault.name}
                                </span>
                                <span className="font-mono-tabular text-[#4a5a70] dark:text-[#92a4bc]">
                                  {hideBalances
                                    ? `•••• · ${pct}%`
                                    : `${formatCurrency(vault.currentAmount, vault.currency)} · ${pct}%`}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#e8eef5] dark:bg-[#182538] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-sky-600 dark:bg-sky-400"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="tab-activity"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                >
                  <div className="lg:col-span-8">
                    <ActivityPanel
                      transactions={transactions}
                      cards={cards}
                      hideBalances={hideBalances}
                      onDeleteTransaction={(txId) => {
                        setTransactions((prev) => prev.filter((t) => t.id !== txId));
                        setToast({ message: 'Removed transaction entry' });
                      }}
                    />
                  </div>
                  <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-5 space-y-3">
                      <h3 className="font-display text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                        Quick Actions
                      </h3>
                      <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">
                        Record a contactless payment, transfer, or card deposit directly into your
                        ledger.
                      </p>
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={cards.length === 0}
                          onClick={() =>
                            setActionSheet({
                              open: true,
                              kind: 'pay',
                              cardId: selectedCardId ?? cards[0]?.id ?? null,
                            })
                          }
                          className="h-11 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-semibold transition-all"
                        >
                          New Tap to Pay
                        </button>
                        <button
                          type="button"
                          disabled={cards.length === 0}
                          onClick={() =>
                            setActionSheet({
                              open: true,
                              kind: 'send',
                              cardId: selectedCardId ?? cards[0]?.id ?? null,
                            })
                          }
                          className="h-11 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-xs font-semibold text-[#0d1726] dark:text-[#f0f5fa] disabled:opacity-50 active:scale-[0.98] transition-all"
                        >
                          Send to Contact
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'vaults' && (
                <motion.div
                  key="tab-vaults"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <VaultsPanel
                    vaults={vaults}
                    cards={cards}
                    displayCurrency={displayCurrency}
                    hideBalances={hideBalances}
                    onCreateVault={handleCreateVault}
                    onDeleteVault={handleDeleteVault}
                    onTransferVault={handleVaultTransfer}
                  />
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div
                  key="tab-insights"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <InsightsPanel
                    cards={cards}
                    transactions={transactions}
                    displayCurrency={displayCurrency}
                    hideBalances={hideBalances}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar with safe-area padding & native active indicator */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/95 dark:bg-[#111b2a]/95 backdrop-blur-xl border-t border-[#dce4ee] dark:border-[#213248] shadow-[0_-4px_20px_rgba(13,23,38,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)]"
      >
        <div className="grid grid-cols-4 h-16 items-center px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                  active
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-[#4a5a70] dark:text-[#92a4bc]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-tab-indicator"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-x-3 inset-y-0.5 rounded-2xl bg-sky-500/10 dark:bg-sky-400/12"
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
                <span className="relative z-10 text-[11px] font-semibold tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals & Sheets */}
      <CardFormSheet
        open={cardFormOpen}
        editingCard={editingCard}
        defaultCurrency={displayCurrency}
        onClose={() => {
          setCardFormOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCard}
      />

      <DeleteConfirmModal
        card={cardToDelete}
        onCancel={() => setCardToDelete(null)}
        onConfirm={handleConfirmDeleteCard}
      />

      <PaymentActionSheet
        open={actionSheet.open}
        kind={actionSheet.kind}
        cards={cards}
        initialCardId={actionSheet.cardId}
        onClose={() => setActionSheet((prev) => ({ ...prev, open: false }))}
        onExecute={handleExecuteAction}
      />

      {/* Profile & Preferences Drawer */}
      <AnimatePresence>
        {profileOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-[#111b2a] rounded-t-3xl sm:rounded-3xl border border-[#dce4ee] dark:border-[#213248] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2
                  id="profile-modal-title"
                  className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]"
                >
                  Wallet Profile
                </h2>
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  aria-label="Close profile menu"
                  className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#4a5a70]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3.5">
                {!avatarFailed ? (
                  <img
                    src={USER_PROFILE.avatarUrl}
                    alt={USER_PROFILE.name}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="h-12 w-12 rounded-full object-cover border border-[#dce4ee] dark:border-[#213248]"
                  />
                ) : (
                  <span className="h-12 w-12 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center">
                    EV
                  </span>
                )}
                <div>
                  <p className="font-display text-base font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                    {USER_PROFILE.name}
                  </p>
                  <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">{USER_PROFILE.email}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#dce4ee] dark:border-[#213248]">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setEditingCard(null);
                    setCardFormOpen(true);
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setIsLocked(true);
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-sm font-medium text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>Lock Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setSplashExited(false);
                    setShowSplash(true);
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-sm font-medium text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>Replay Launch Splash</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="w-full h-11 px-4 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] text-sm font-medium text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Sample Data</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subtle Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-[#0d1726] dark:bg-white text-white dark:text-[#0d1726] px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 text-xs font-medium"
          >
            <Check className="h-4 w-4 text-sky-400 dark:text-sky-600 shrink-0" />
            <span>{toast.message}</span>
            {toast.undoCard && (
              <button
                type="button"
                onClick={() => handleUndoDelete(toast.undoCard!)}
                className="font-bold text-sky-400 dark:text-sky-600 hover:underline pl-1"
              >
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <CardAddedCelebration
        card={recentlyAddedCard}
        displayCurrency={displayCurrency}
        hideBalances={hideBalances}
        onDismiss={() => setRecentlyAddedCard(null)}
      />

      {/* Biometric Launch & Re-Lock Overlay (ready instantly under lifting splash curtain) */}
      <BiometricLockScreen
        locked={isLocked && !showSplash}
        instantEnter={!splashExited}
        onUnlock={() => {
          setIsLocked(false);
          triggerHydration(520);
        }}
      />

      {/* Animated Launch Splash Screen */}
      <SplashScreen
        visible={showSplash}
        onComplete={() => setShowSplash(false)}
        onAfterExit={() => setSplashExited(true)}
      />
    </div>
  );
}
