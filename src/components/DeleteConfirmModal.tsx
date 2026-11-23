import { AnimatePresence, motion } from 'motion/react';
import { Trash2, X } from 'lucide-react';
import type { WalletCard } from '../types/wallet';

interface DeleteConfirmModalProps {
  card: WalletCard | null;
  onCancel: () => void;
  onConfirm: (cardId: string) => void;
}

export function DeleteConfirmModal({ card, onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {card && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-card-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#111b2a] rounded-t-3xl sm:rounded-3xl border border-[#dce4ee] dark:border-[#213248] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Close delete confirmation"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#4a5a70] hover:bg-[#f3f6fa] dark:text-[#92a4bc] dark:hover:bg-[#182538]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3
              id="delete-card-title"
              className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa] mt-4"
            >
              Remove {card.nickname}?
            </h3>
            <p className="text-sm text-[#4a5a70] dark:text-[#92a4bc] mt-1.5 leading-relaxed">
              This removes the {card.network} card ending in {card.cardNumber.slice(-4)} from your
              wallet. Historical activity records remain in your ledger.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-12 rounded-xl border border-[#dce4ee] dark:border-[#213248] text-sm font-semibold text-[#0d1726] dark:text-[#f0f5fa] hover:bg-[#f3f6fa] dark:hover:bg-[#182538] transition-colors"
              >
                Keep Card
              </button>
              <button
                type="button"
                onClick={() => onConfirm(card.id)}
                className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors"
              >
                Delete Card
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
