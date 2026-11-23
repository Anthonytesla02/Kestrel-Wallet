import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import type { CurrencyCode, WalletCard } from '../types/wallet';
import { CardVisual } from './CardVisual';

interface CardAddedCelebrationProps {
  card: WalletCard | null;
  displayCurrency: CurrencyCode;
  hideBalances?: boolean;
  onDismiss: () => void;
}

export function CardAddedCelebration({
  card,
  displayCurrency,
  hideBalances = false,
  onDismiss,
}: CardAddedCelebrationProps) {
  useEffect(() => {
    if (!card) return;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [card, onDismiss]);

  return (
    <AnimatePresence>
      {card && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-added-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] p-6 shadow-2xl text-center space-y-5 overflow-hidden"
          >
            {/* Animated check badge with radial ring pulse */}
            <div className="relative h-14 w-14 mx-auto flex items-center justify-center">
              <motion.span
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-sky-500"
              />
              <motion.div
                initial={{ scale: 0.65, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="h-12 w-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30"
              >
                <Check className="h-6 w-6" strokeWidth={2.75} />
              </motion.div>
            </div>

            <div>
              <h2
                id="card-added-title"
                className="font-display text-lg font-bold text-[#0d1726] dark:text-[#f0f5fa] flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>Card Added to Wallet</span>
              </h2>
              <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc] mt-1">
                {card.nickname} · {card.network} •••• {card.cardNumber.slice(-4)}
              </p>
            </div>

            {/* 3D Spring Showcase of newly added card */}
            <motion.div
              initial={{ scale: 0.8, y: 24, rotateX: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotateX: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.12 }}
              className="relative"
            >
              <CardVisual
                card={card}
                displayCurrency={displayCurrency}
                hideBalances={hideBalances}
                compact
              />
              {/* Metallic shine sweep */}
              <motion.div
                aria-hidden="true"
                initial={{ x: '-120%' }}
                animate={{ x: '220%' }}
                transition={{ duration: 0.85, delay: 0.28, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>

            <button
              type="button"
              onClick={onDismiss}
              className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-transform active:scale-[0.98]"
            >
              View in Wallet
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
