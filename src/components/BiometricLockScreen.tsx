import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, KeyRound, ScanFace, ShieldCheck } from 'lucide-react';
import { KestrelLogo } from './KestrelLogo';
import {
  authenticateWithNativeBiometrics,
  checkNativeBiometricAvailability,
  getBiometricActionLabel,
  getBiometricStatusCopy,
  isHardwareBiometricsSupported,
  isRunningNativeApp,
  triggerWebAuthnBiometricPrompt,
  type BiometricMethod,
  type BiometricPhase,
} from '../utils/biometricLogic';
import { USER_PROFILE } from '../data/seedData';

interface BiometricLockScreenProps {
  locked: boolean;
  onUnlock: () => void;
  instantEnter?: boolean;
}

/**
 * Detailed anatomical fingerprint ridge SVG with authentic whorl/loop geometry.
 * Base layer shows subtle cool-slate ridges; overlay layer illuminates in glacial sapphire during scan.
 */
function RealisticFingerprintGraphic({
  phase,
  progress,
}: {
  phase: BiometricPhase;
  progress: number;
}) {
  const isScanning = phase === 'scanning';
  const isVerified = phase === 'verified';

  const ridgePaths = [
    // Outer arch ridges
    'M 34 86 C 32 54, 48 26, 72 26 C 96 26, 112 54, 110 86',
    'M 27 96 C 24 54, 44 18, 72 18 C 100 18, 120 54, 117 96',
    'M 42 114 C 35 102, 33 88, 34 74',
    'M 110 74 C 111 90, 108 104, 100 116',
    // Mid-outer concentric loops with realistic ridge breaks
    'M 41 94 C 39 62, 52 34, 72 34 C 92 34, 105 60, 103 92 C 102 103, 98 112, 91 120',
    'M 48 119 C 43 108, 41 98, 41 94',
    'M 48 100 C 46 70, 56 42, 72 42 C 88 42, 98 66, 96 96 C 95 107, 90 117, 82 124',
    'M 57 124 C 52 116, 49 109, 48 100',
    // Inner loop & bifurcation ridges
    'M 55 104 C 53 76, 60 50, 72 50 C 84 50, 91 70, 89 96 C 88 108, 82 118, 73 126',
    'M 64 126 C 59 119, 56 112, 55 104',
    'M 62 104 C 60 82, 64 58, 72 58 C 80 58, 84 74, 82 96 C 81 107, 76 115, 69 121',
    // Core whorl / central loop
    'M 68 104 C 67 88, 68 66, 72 66 C 76 66, 77 78, 76 95 C 75 103, 72 110, 66 114',
    'M 72 74 C 71 84, 71 95, 69 103',
    // Lower delta / basal ridges
    'M 33 108 C 38 117, 46 125, 56 129',
    'M 88 128 C 96 124, 104 116, 109 106',
  ];

  return (
    <div className="relative h-36 w-36 mx-auto flex items-center justify-center">
      {/* Outer progress ring */}
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
        <circle
          cx="72"
          cy="72"
          r="66"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-[#dce4ee] dark:text-[#213248]"
        />
        <circle
          cx="72"
          cy="72"
          r="66"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 66}
          strokeDashoffset={2 * Math.PI * 66 * (1 - progress / 100)}
          className={`transition-all duration-150 ${
            isVerified ? 'text-teal-500' : 'text-sky-600 dark:text-sky-400'
          }`}
        />
      </svg>

      {/* Sensor well */}
      <div className="relative h-28 w-28 rounded-full bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] overflow-hidden flex items-center justify-center shadow-inner">
        <svg viewBox="0 0 144 144" className="h-24 w-24" aria-hidden="true">
          {/* Base dormant ridges */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            className="text-slate-400/60 dark:text-slate-600/80"
          >
            {ridgePaths.map((d, idx) => (
              <path key={`base-${idx}`} d={d} />
            ))}
          </g>

          {/* Illuminated active ridges */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              clipPath: isVerified
                ? 'inset(0% 0% 0% 0%)'
                : isScanning
                ? `inset(${Math.max(0, 100 - progress)}% 0% 0% 0%)`
                : 'inset(100% 0% 0% 0%)',
              transition: 'clip-path 120ms linear',
            }}
            className={
              isVerified ? 'text-teal-600 dark:text-teal-400' : 'text-sky-600 dark:text-sky-400'
            }
          >
            {ridgePaths.map((d, idx) => (
              <path key={`glow-${idx}`} d={d} />
            ))}
          </g>
        </svg>

        {/* Moving laser scan line */}
        {isScanning && (
          <motion.div
            initial={{ top: '8%' }}
            animate={{ top: ['10%', '88%', '10%'] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-2 h-0.5 bg-sky-500 dark:bg-sky-300 shadow-[0_0_12px_2px_rgba(14,165,233,0.65)] pointer-events-none"
          />
        )}

        {/* Verified badge overlay */}
        {isVerified && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RealisticFaceGraphic({
  phase,
  progress,
}: {
  phase: BiometricPhase;
  progress: number;
}) {
  const isScanning = phase === 'scanning';
  const isVerified = phase === 'verified';

  return (
    <div className="relative h-36 w-36 mx-auto flex items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 144 144" aria-hidden="true">
        <circle
          cx="72"
          cy="72"
          r="66"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-[#dce4ee] dark:text-[#213248]"
        />
        <circle
          cx="72"
          cy="72"
          r="66"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 66}
          strokeDashoffset={2 * Math.PI * 66 * (1 - progress / 100)}
          className={`transition-all duration-150 ${
            isVerified ? 'text-teal-500' : 'text-sky-600 dark:text-sky-400'
          }`}
        />
      </svg>

      <div className="relative h-28 w-28 rounded-3xl bg-[#f3f6fa] dark:bg-[#182538] border border-[#dce4ee] dark:border-[#213248] overflow-hidden flex items-center justify-center shadow-inner">
        <ScanFace
          className={`h-16 w-16 transition-colors duration-300 ${
            isVerified
              ? 'text-teal-600 dark:text-teal-400'
              : isScanning
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
          strokeWidth={1.5}
        />

        {isScanning && (
          <motion.div
            initial={{ top: '10%' }}
            animate={{ top: ['12%', '86%', '12%'] }}
            transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-3 h-0.5 bg-sky-500 dark:bg-sky-300 shadow-[0_0_12px_2px_rgba(14,165,233,0.65)] pointer-events-none"
          />
        )}

        {isVerified && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function BiometricLockScreen({
  locked,
  onUnlock,
  instantEnter = false,
}: BiometricLockScreenProps) {
  const [method, setMethod] = useState<BiometricMethod>('fingerprint');
  const [phase, setPhase] = useState<BiometricPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [isNativeApp] = useState<boolean>(() => isRunningNativeApp());
  const [hardwareAvailable, setHardwareAvailable] = useState(false);
  const [webAuthnNote, setWebAuthnNote] = useState('');
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (isNativeApp) {
      checkNativeBiometricAvailability().then((status) => {
        setHardwareAvailable(status.isAvailable);
      });
    } else {
      isHardwareBiometricsSupported().then((supported) => {
        setHardwareAvailable(supported);
      });
    }
  }, [isNativeApp]);

  useEffect(() => {
    if (!locked) return;
    setPhase('idle');
    setProgress(0);
    setWebAuthnNote('');
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [locked]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const handlePrimaryScan = async () => {
    if (phase === 'scanning' || phase === 'verified') return;
    clearTimers();
    setWebAuthnNote('');

    if (isNativeApp) {
      setPhase('scanning');
      setProgress(50);
      const res = await authenticateWithNativeBiometrics(method);
      if (res.ok) {
        setProgress(100);
        setPhase('verified');
        const t = window.setTimeout(() => onUnlock(), 380);
        timersRef.current.push(t);
      } else {
        setPhase('error');
        setProgress(0);
        setWebAuthnNote(res.error ?? 'Fingerprint verification failed.');
      }
      return;
    }

    setPhase('scanning');
    setProgress(15);

    const steps = [
      { delay: 160, pct: 38 },
      { delay: 340, pct: 64 },
      { delay: 540, pct: 86 },
      { delay: 760, pct: 100 },
    ];

    steps.forEach((s) => {
      const t = window.setTimeout(() => setProgress(s.pct), s.delay);
      timersRef.current.push(t);
    });

    const verifyTimer = window.setTimeout(() => {
      setPhase('verified');
    }, 840);
    timersRef.current.push(verifyTimer);

    const unlockTimer = window.setTimeout(() => {
      onUnlock();
    }, 1250);
    timersRef.current.push(unlockTimer);
  };

  const handleHardwareBiometric = async () => {
    if (phase === 'scanning' || phase === 'verified') return;
    setWebAuthnNote('');
    setPhase('scanning');
    setProgress(45);
    const result = await triggerWebAuthnBiometricPrompt();
    if (result.ok) {
      setProgress(100);
      setPhase('verified');
      const t = window.setTimeout(() => onUnlock(), 450);
      timersRef.current.push(t);
    } else {
      setPhase('idle');
      setProgress(0);
      setWebAuthnNote(
        result.reason ?? 'Hardware prompt unavailable here. Use the sensor scan button.'
      );
    }
  };

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          key="biometric-lock-overlay"
          initial={instantEnter ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="biometric-lock-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#f3f6fa]/88 dark:bg-[#09101a]/92 backdrop-blur-2xl"
        >
          <motion.div
            initial={instantEnter ? { y: 0, opacity: 1 } : { y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#111b2a] border border-[#dce4ee] dark:border-[#213248] shadow-2xl p-6 sm:p-7 text-center space-y-5"
          >
            {/* Brand Header */}
            <div className="flex flex-col items-center">
              <KestrelLogo className="h-12 w-12 shadow-md shadow-sky-600/20 rounded-2xl" />
              <h1
                id="biometric-lock-title"
                className="font-display text-xl font-bold text-[#0d1726] dark:text-[#f0f5fa] mt-3"
              >
                Unlock Kestrel Wallet
              </h1>
              <p className="text-xs text-[#4a5a70] dark:text-[#92a4bc] mt-1">
                {USER_PROFILE.name} · Protected Vault
              </p>
            </div>

            {/* Method Segmented Switcher */}
            <div
              className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#e8eef5] dark:bg-[#182538]"
              role="tablist"
              aria-label="Biometric method"
            >
              <button
                type="button"
                role="tab"
                aria-selected={method === 'fingerprint'}
                disabled={phase === 'scanning' || phase === 'verified'}
                onClick={() => {
                  setMethod('fingerprint');
                  setPhase('idle');
                  setProgress(0);
                }}
                className={`h-10 rounded-lg text-xs font-semibold transition-colors ${
                  method === 'fingerprint'
                    ? 'bg-white dark:bg-[#111b2a] text-[#0d1726] dark:text-[#f0f5fa] shadow-xs'
                    : 'text-[#4a5a70] dark:text-[#92a4bc]'
                }`}
              >
                Fingerprint
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === 'face'}
                disabled={phase === 'scanning' || phase === 'verified'}
                onClick={() => {
                  setMethod('face');
                  setPhase('idle');
                  setProgress(0);
                }}
                className={`h-10 rounded-lg text-xs font-semibold transition-colors ${
                  method === 'face'
                    ? 'bg-white dark:bg-[#111b2a] text-[#0d1726] dark:text-[#f0f5fa] shadow-xs'
                    : 'text-[#4a5a70] dark:text-[#92a4bc]'
                }`}
              >
                Face ID
              </button>
            </div>

            {/* Interactive Biometric Sensor Graphic */}
            <button
              type="button"
              onClick={handlePrimaryScan}
              disabled={phase === 'scanning' || phase === 'verified'}
              aria-label={
                method === 'fingerprint'
                  ? 'Touch fingerprint sensor to scan'
                  : 'Tap Face ID reticle to scan'
              }
              className="block mx-auto rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 active:scale-[0.97] transition-transform cursor-pointer disabled:cursor-default"
            >
              {method === 'fingerprint' ? (
                <RealisticFingerprintGraphic phase={phase} progress={progress} />
              ) : (
                <RealisticFaceGraphic phase={phase} progress={progress} />
              )}
            </button>

            {/* Status text */}
            <div className="min-h-[40px] flex flex-col justify-center">
              <p className="text-xs font-medium text-[#4a5a70] dark:text-[#92a4bc] leading-relaxed">
                {getBiometricStatusCopy(method, phase, isNativeApp)}
              </p>
              {webAuthnNote && (
                <p
                  role="alert"
                  className={`text-[11px] mt-1.5 ${
                    phase === 'error'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {webAuthnNote}
                </p>
              )}
            </div>

            {/* Primary Scan Action Button */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handlePrimaryScan}
                disabled={phase === 'scanning' || phase === 'verified'}
                className={`w-full h-12 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  phase === 'verified'
                    ? 'bg-teal-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 disabled:opacity-80 text-white shadow-sm'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{getBiometricActionLabel(method, phase, isNativeApp)}</span>
              </button>

              {!isNativeApp && hardwareAvailable && (
                <button
                  type="button"
                  onClick={handleHardwareBiometric}
                  disabled={phase === 'scanning' || phase === 'verified'}
                  className="w-full h-11 rounded-xl bg-[#f3f6fa] dark:bg-[#182538] hover:bg-[#e8eef5] dark:hover:bg-[#213248] border border-[#dce4ee] dark:border-[#213248] text-xs font-medium text-[#0d1726] dark:text-[#f0f5fa] inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  <KeyRound className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Use Device Biometrics (WebAuthn)</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
