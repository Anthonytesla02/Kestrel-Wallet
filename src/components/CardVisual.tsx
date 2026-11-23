import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Snowflake, Wifi } from 'lucide-react';
import type { CardNetwork, CurrencyCode, WalletCard } from '../types/wallet';
import { CARD_THEMES } from './CardThemeStyles';
import {
  convertCurrency,
  formatCardNumber,
  formatCurrency,
  getCardAvailableFunds,
  maskCardNumber,
} from '../utils/walletLogic';

interface CardVisualProps {
  card: WalletCard;
  displayCurrency?: CurrencyCode;
  isFlipped?: boolean;
  onFlipToggle?: () => void;
  compact?: boolean;
}

function NetworkMark({ network, isLightSurface }: { network: CardNetwork; isLightSurface: boolean }) {
  if (network === 'Mastercard') {
    return (
      <div className="flex items-center" aria-label="Mastercard">
        <span className="h-5 w-5 rounded-full bg-sky-500/90" />
        <span className="-ml-2 h-5 w-5 rounded-full bg-cyan-300/85 mix-blend-screen" />
      </div>
    );
  }
  if (network === 'Visa') {
    return (
      <span
        className={`font-display text-base font-extrabold italic tracking-tight ${
          isLightSurface ? 'text-slate-900' : 'text-white'
        }`}
      >
        VISA
      </span>
    );
  }
  if (network === 'Amex') {
    return (
      <span
        className={`font-display text-xs font-bold tracking-widest uppercase px-1.5 py-0.5 border ${
          isLightSurface ? 'border-slate-800/40 text-slate-900' : 'border-white/40 text-white'
        } rounded`}
      >
        AMEX
      </span>
    );
  }
  return (
    <span
      className={`font-display text-xs font-bold uppercase tracking-wider ${
        isLightSurface ? 'text-slate-900' : 'text-white'
      }`}
    >
      {network}
    </span>
  );
}

function EmvChip({ isLightSurface }: { isLightSurface: boolean }) {
  return (
    <svg
      width="36"
      height="26"
      viewBox="0 0 36 26"
      fill="none"
      aria-hidden="true"
      className="shrink-0 opacity-90"
    >
      <rect
        x="0.75"
        y="0.75"
        width="34.5"
        height="24.5"
        rx="4.25"
        fill={isLightSurface ? '#cbd5e1' : '#e2e8f0'}
        fillOpacity={isLightSurface ? '0.7' : '0.24'}
        stroke={isLightSurface ? '#475569' : '#f8fafc'}
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <path
        d="M12 1V25M24 1V25M1 9H12M1 17H12M24 9H35M24 17H35M12 13H24"
        stroke={isLightSurface ? '#475569' : '#f8fafc'}
        strokeOpacity="0.45"
        strokeWidth="1"
      />
    </svg>
  );
}

export function CardVisual({
  card,
  displayCurrency,
  isFlipped = false,
  onFlipToggle,
  compact = false,
}: CardVisualProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copied, setCopied] = useState(false);

  const theme = CARD_THEMES[card.theme] ?? CARD_THEMES['arctic-cobalt'];
  const isLightSurface = card.theme === 'frosted-titanium' || card.theme === 'nordic-mist';
  const targetCurrency = displayCurrency ?? card.currency;
  const rawAvailable = getCardAvailableFunds(card);
  const displayAmount = convertCurrency(rawAvailable, card.currency, targetCurrency);

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = formatCardNumber(card.cardNumber);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className={`perspective-1200 w-full select-none ${
        compact ? 'aspect-[1.62/1]' : 'aspect-[1.586/1]'
      }`}
    >
      <div
        className={`relative h-full w-full preserve-3d transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT FACE */}
        <div
          onClick={onFlipToggle}
          role={onFlipToggle ? 'button' : undefined}
          tabIndex={onFlipToggle && !isFlipped ? 0 : -1}
          aria-hidden={isFlipped}
          onKeyDown={(e) => {
            if (onFlipToggle && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onFlipToggle();
            }
          }}
          aria-label={
            onFlipToggle
              ? `${card.nickname} ending in ${card.cardNumber.slice(-4)}. Click to inspect card back.`
              : undefined
          }
          className={`absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-lg shadow-slate-900/15 dark:shadow-black/40 border border-white/20 ${
            theme.surfaceClass
          } ${isFlipped ? 'pointer-events-none z-0' : 'z-10'} ${
            onFlipToggle
              ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500'
              : ''
          }`}
        >
          {theme.imageUrl && !imgFailed && (
            <img
              src={theme.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Measured contrast scrim */}
          <div className={`absolute inset-0 ${theme.scrimClass}`} />

          {/* Subtle metallic sheen line */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                'linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.16) 48%, transparent 65%)',
            }}
          />

          {/* Frozen Ice Overlay */}
          {card.isFrozen && (
            <div className="absolute inset-0 z-20 backdrop-blur-[3px] bg-sky-950/55 flex flex-col items-center justify-center text-white px-4 text-center">
              <div className="h-11 w-11 rounded-full bg-sky-400/20 border border-sky-200/40 flex items-center justify-center mb-2">
                <Snowflake className="h-5 w-5 text-sky-200" />
              </div>
              <p className="font-display text-sm font-semibold tracking-tight">Card Frozen</p>
              <p className="text-xs text-sky-100/80 mt-0.5">
                Payments and transfers are paused
              </p>
            </div>
          )}

          <div
            className={`relative z-10 flex h-full flex-col justify-between ${
              compact ? 'p-4' : 'p-5 sm:p-6'
            } ${theme.textClass}`}
          >
            {/* Top row: Nickname & metadata · Network */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={`font-display font-semibold tracking-tight truncate ${
                    compact ? 'text-sm' : 'text-base'
                  }`}
                >
                  {card.nickname}
                </p>
                <p className={`text-xs mt-0.5 capitalize ${theme.mutedTextClass}`}>
                  {card.type}
                  {card.isDefault ? ' · Primary' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Wifi className={`h-4 w-4 rotate-90 opacity-75 ${theme.textClass}`} aria-hidden="true" />
                <NetworkMark network={card.network} isLightSurface={isLightSurface} />
              </div>
            </div>

            {/* Middle row: EMV Chip + Available balance */}
            <div className="flex items-center justify-between gap-3 my-auto">
              <EmvChip isLightSurface={isLightSurface} />
              <div className="text-right">
                <p className={`text-[11px] font-medium ${theme.mutedTextClass}`}>
                  {card.type === 'credit' ? 'Available Credit' : 'Available Balance'}
                </p>
                <p
                  className={`font-display font-bold tracking-tight tabular-nums ${
                    compact ? 'text-lg' : 'text-xl sm:text-2xl'
                  }`}
                >
                  {formatCurrency(displayAmount, targetCurrency)}
                </p>
              </div>
            </div>

            {/* Bottom row: Masked number + Holder + Expiry */}
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={`font-mono-tabular tracking-wider ${
                    compact ? 'text-xs' : 'text-sm sm:text-[15px]'
                  }`}
                >
                  {maskCardNumber(card.cardNumber)}
                </p>
                <p
                  className={`text-[11px] font-medium uppercase tracking-wider truncate mt-1 ${theme.mutedTextClass}`}
                >
                  {card.holderName}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[10px] uppercase tracking-wider ${theme.mutedTextClass}`}>
                  Exp
                </p>
                <p className="font-mono-tabular text-xs sm:text-sm font-medium">{card.expiry}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          onClick={onFlipToggle}
          aria-hidden={!isFlipped}
          className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden shadow-lg shadow-slate-900/20 border border-white/20 ${
            theme.surfaceClass
          } ${isFlipped ? 'z-10 pointer-events-auto' : 'z-0 pointer-events-none'} cursor-pointer`}
        >
          {theme.imageUrl && !imgFailed && (
            <img
              src={theme.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
          )}
          <div className={`absolute inset-0 ${theme.scrimClass}`} />

          <div className={`relative z-10 flex h-full flex-col justify-between py-4 ${theme.textClass}`}>
            {/* Magnetic stripe */}
            <div className="h-9 w-full bg-slate-950/90 border-y border-white/10" />

            {/* Card details & CVV */}
            <div className="px-5 space-y-3">
              <div className="flex items-center justify-between gap-2 bg-white/12 backdrop-blur-sm rounded-xl px-3.5 py-2.5 border border-white/15">
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-wider ${theme.mutedTextClass}`}>
                    Card Number
                  </p>
                  <p className="font-mono-tabular text-xs sm:text-sm font-medium tracking-wider truncate">
                    {formatCardNumber(card.cardNumber)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  aria-label="Copy card number"
                  className="min-h-[36px] min-w-[36px] px-2.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                  <p className={`text-[10px] uppercase tracking-wider ${theme.mutedTextClass}`}>
                    Expires
                  </p>
                  <p className="font-mono-tabular text-sm font-semibold mt-0.5">{card.expiry}</p>
                </div>

                <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider ${theme.mutedTextClass}`}>
                      CVV
                    </p>
                    <p className="font-mono-tabular text-sm font-semibold mt-0.5">
                      {showCvv ? card.cvv : '•••'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCvv((prev) => !prev);
                    }}
                    aria-label={showCvv ? 'Hide CVV' : 'Show CVV'}
                    className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
                  >
                    {showCvv ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                  <p className={`text-[10px] uppercase tracking-wider ${theme.mutedTextClass}`}>
                    Monthly Cap
                  </p>
                  <p className="font-mono-tabular text-xs font-semibold mt-0.5 truncate">
                    {formatCurrency(card.monthlyLimit, card.currency, { compact: true })}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 flex items-center justify-between text-[11px]">
              <span className={theme.mutedTextClass}>Tap card to flip back</span>
              <span className="font-medium">{card.network}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
