import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, PiggyBank, Plus, Trash2, X } from 'lucide-react';
import type { CurrencyCode, SavingsVault, WalletCard } from '../types/wallet';
import { formatCurrency } from '../utils/walletLogic';

interface VaultsPanelProps {
  vaults: SavingsVault[];
  cards: WalletCard[];
  displayCurrency: CurrencyCode;
  hideBalances?: boolean;
  onCreateVault: (vault: Omit<SavingsVault, 'id'>) => void;
  onDeleteVault: (vaultId: string) => void;
  onTransferVault: (params: {
    vaultId: string;
    cardId: string;
    amount: number;
    direction: 'deposit' | 'withdraw';
  }) => { ok: boolean; error?: string };
}

export function VaultsPanel({
  vaults,
  cards,
  displayCurrency,
  hideBalances = false,
  onCreateVault,
  onDeleteVault,
  onTransferVault,
}: VaultsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [targetAmount, setTargetAmount] = useState('3000');
  const [targetDate, setTargetDate] = useState('Dec 2027');

  const [transferModal, setTransferModal] = useState<{
    vault: SavingsVault;
    direction: 'deposit' | 'withdraw';
  } | null>(null);
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id ?? '');
  const [transferAmount, setTransferAmount] = useState('150');
  const [transferError, setTransferError] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    if (!vaultName.trim() || !Number.isFinite(target) || target <= 0) return;
    onCreateVault({
      name: vaultName.trim(),
      targetAmount: Number(target.toFixed(2)),
      currentAmount: 0,
      currency: displayCurrency,
      accentTone: 'sapphire',
      targetDate: targetDate.trim() || 'Flexible',
    });
    setVaultName('');
    setTargetAmount('3000');
    setShowCreate(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModal) return;
    const res = onTransferVault({
      vaultId: transferModal.vault.id,
      cardId: selectedCardId || cards[0]?.id || '',
      amount: Number(transferAmount),
      direction: transferModal.direction,
    });
    if (!res.ok) {
      setTransferError(res.error ?? 'Transfer could not be completed.');
      return;
    }
    setTransferError('');
    setTransferModal(null);
  };

  const debitCards = cards.filter((c) => c.type !== 'credit');

  return (
    <section
      aria-label="Savings Vaults"
      className="rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-5 sm:p-6 space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]">
            Savings Vaults
          </h2>
          <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc]">
            Dedicated reserves funded directly from your cards
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="h-11 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>New Vault</span>
        </button>
      </div>

      {vaults.length === 0 ? (
        <div className="py-10 text-center">
          <PiggyBank className="h-8 w-8 text-sky-600 dark:text-sky-400 mx-auto" />
          <p className="text-sm font-medium text-[#0d1726] dark:text-[#f0f5fa] mt-2">
            No savings vaults created yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          {vaults.map((vault) => {
            const pct = Math.min(100, Math.round((vault.currentAmount / vault.targetAmount) * 100));
            const radius = 22;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference - (pct / 100) * circumference;

            return (
              <div
                key={vault.id}
                className="rounded-2xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
                      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4.5"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          className="text-sky-600 dark:text-sky-400 transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute font-mono-tabular text-[11px] font-bold text-[#0d1726] dark:text-[#f0f5fa]">
                        {pct}%
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold text-[#0d1726] dark:text-[#f0f5fa] truncate">
                        {vault.name}
                      </h3>
                      <p className="font-mono-tabular text-xs text-[#4a5a70] dark:text-[#92a4bc] mt-0.5">
                        {hideBalances
                          ? '•••••• / ••••••'
                          : `${formatCurrency(vault.currentAmount, vault.currency)} / ${formatCurrency(vault.targetAmount, vault.currency)}`}
                      </p>
                      <p className="text-[11px] text-[#4a5a70] dark:text-[#92a4bc] mt-0.5">
                        Target · {vault.targetDate ?? 'Flexible'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteVault(vault.id)}
                    aria-label={`Delete ${vault.name} vault`}
                    className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-[#4a5a70] hover:text-rose-600 dark:text-[#92a4bc] dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={debitCards.length === 0}
                    onClick={() => {
                      setSelectedCardId(debitCards[0]?.id ?? '');
                      setTransferError('');
                      setTransferModal({ vault, direction: 'deposit' });
                    }}
                    className="h-10 rounded-xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] text-xs font-semibold text-[#0d1726] dark:text-[#f0f5fa] hover:border-sky-500 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Add Funds</span>
                  </button>

                  <button
                    type="button"
                    disabled={cards.length === 0 || vault.currentAmount <= 0}
                    onClick={() => {
                      setSelectedCardId(cards[0]?.id ?? '');
                      setTransferError('');
                      setTransferModal({ vault, direction: 'withdraw' });
                    }}
                    className="h-10 rounded-xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] text-xs font-semibold text-[#0d1726] dark:text-[#f0f5fa] hover:border-sky-500 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowUpFromLine className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Withdraw</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Vault Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-vault-title"
        >
          <div
            onClick={() => setShowCreate(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <form
            onSubmit={handleCreateSubmit}
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#111b2a] rounded-t-3xl sm:rounded-3xl border border-[#dce4ee] dark:border-[#213248] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3
                id="create-vault-title"
                className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]"
              >
                Create Savings Vault
              </h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Close vault form"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#4a5a70]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label
                htmlFor="vault-name"
                className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
              >
                Vault Name
              </label>
              <input
                id="vault-name"
                type="text"
                required
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="e.g. Alpine Ski Pass"
                className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="vault-target"
                  className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                >
                  Goal ({displayCurrency})
                </label>
                <input
                  id="vault-target"
                  type="number"
                  min="1"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa]"
                />
              </div>

              <div>
                <label
                  htmlFor="vault-date"
                  className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
                >
                  Target Date
                </label>
                <input
                  id="vault-date"
                  type="text"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
            >
              Create Vault
            </button>
          </form>
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {transferModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-transfer-title"
        >
          <div
            onClick={() => setTransferModal(null)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <form
            onSubmit={handleTransferSubmit}
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#111b2a] rounded-t-3xl sm:rounded-3xl border border-[#dce4ee] dark:border-[#213248] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3
                id="vault-transfer-title"
                className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa]"
              >
                {transferModal.direction === 'deposit'
                  ? `Fund ${transferModal.vault.name}`
                  : `Withdraw from ${transferModal.vault.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setTransferModal(null)}
                aria-label="Close vault transfer"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#4a5a70]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label
                htmlFor="vault-card-select"
                className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
              >
                {transferModal.direction === 'deposit' ? 'From Card' : 'To Card'}
              </label>
              <select
                id="vault-card-select"
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] text-sm text-[#0d1726] dark:text-[#f0f5fa]"
              >
                {(transferModal.direction === 'deposit' ? debitCards : cards).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname} · {formatCurrency(c.balance, c.currency)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="vault-transfer-amount"
                className="block text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] mb-1.5"
              >
                Amount ({transferModal.vault.currency})
              </label>
              <input
                id="vault-transfer-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] font-mono-tabular text-sm text-[#0d1726] dark:text-[#f0f5fa]"
              />
            </div>

            {transferError && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 rounded-xl">
                {transferError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
            >
              {transferModal.direction === 'deposit' ? 'Add to Vault' : 'Withdraw to Card'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
