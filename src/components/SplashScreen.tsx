import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface SplashScreenProps {
  visible: boolean;
  onComplete: () => void;
  onAfterExit?: () => void;
}

const SPARK_DOTS = [
  { angle: -65, dist: 74, size: 7, color: '#0EA5E9', delay: 0.68 },
  { angle: -25, dist: 84, size: 5, color: '#14B8A6', delay: 0.74 },
  { angle: 20, dist: 78, size: 6, color: '#38BDF8', delay: 0.71 },
  { angle: 65, dist: 72, size: 5, color: '#0284C7', delay: 0.78 },
  { angle: 120, dist: 76, size: 6, color: '#14B8A6', delay: 0.73 },
  { angle: 160, dist: 82, size: 5, color: '#38BDF8', delay: 0.76 },
  { angle: -155, dist: 76, size: 7, color: '#0EA5E9', delay: 0.69 },
  { angle: -115, dist: 72, size: 5, color: '#0284C7', delay: 0.75 },
];

export function SplashScreen({ visible, onComplete, onAfterExit }: SplashScreenProps) {
  const [closingStage, setClosingStage] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) {
      completedRef.current = false;
      setClosingStage(false);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    setReducedMotion(prefersReduced);

    const stageCloseTimer = window.setTimeout(
      () => setClosingStage(true),
      prefersReduced ? 1200 : 4720
    );
    const doneTimer = window.setTimeout(
      () => {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
        }
      },
      prefersReduced ? 1500 : 5000
    );

    return () => {
      window.clearTimeout(stageCloseTimer);
      window.clearTimeout(doneTimer);
    };
  }, [visible]);

  return (
    <AnimatePresence onExitComplete={onAfterExit}>
      {visible && (
        <motion.div
          key="kestrel-splash-screen"
          data-testid="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] overflow-hidden bg-[#f3f6fa] dark:bg-[#0f172a] text-[#0d1726] dark:text-[#f0f5fa] flex flex-col items-center justify-center select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Kestrel Wallet launch animation"
        >
          {/* Soft Sky Accent Wash */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 44%, rgba(14,165,233,0.12) 0%, rgba(20,184,166,0.05) 38%, transparent 72%)',
            }}
          />

          {/* Center Stage Kinetic Emblem */}
          <motion.div
            animate={closingStage ? { opacity: 0, scale: 0.94 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center justify-center px-6"
          >
            <div className="relative h-40 w-40 flex items-center justify-center">
              {/* Crisp Expanding Sky Ripple Rings */}
              {!reducedMotion && (
                <>
                  <motion.span
                    aria-hidden="true"
                    initial={{ scale: 0.55, opacity: 0.7 }}
                    animate={{ scale: 1.95, opacity: 0 }}
                    transition={{ duration: 1.35, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute h-24 w-24 rounded-full border-2 border-sky-400/70 pointer-events-none"
                  />
                  <motion.span
                    aria-hidden="true"
                    initial={{ scale: 0.55, opacity: 0.55 }}
                    animate={{ scale: 2.3, opacity: 0 }}
                    transition={{ duration: 1.45, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute h-24 w-24 rounded-full border border-teal-400/55 pointer-events-none"
                  />
                  <motion.span
                    aria-hidden="true"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: [0.7, 1.85], opacity: [0, 0.45, 0] }}
                    transition={{ duration: 1.4, delay: 2.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute h-24 w-24 rounded-full border border-sky-400/60 pointer-events-none"
                  />

                  {/* Crisp Playful Geometric Spark Dots */}
                  {SPARK_DOTS.map((dot, idx) => {
                    const rad = (dot.angle * Math.PI) / 180;
                    const tx = Math.cos(rad) * dot.dist;
                    const ty = Math.sin(rad) * dot.dist;
                    return (
                      <motion.span
                        key={idx}
                        aria-hidden="true"
                        style={{
                          width: dot.size,
                          height: dot.size,
                          backgroundColor: dot.color,
                        }}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                        animate={{
                          x: tx,
                          y: ty,
                          scale: [0, 1.2, 0.4],
                          opacity: [0, 0.95, 0],
                        }}
                        transition={{
                          duration: 1.15,
                          delay: dot.delay,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="absolute rounded-full pointer-events-none"
                      />
                    );
                  })}
                </>
              )}

              {/* Gentle Ambient Levitation Wrapper */}
              <motion.div
                animate={reducedMotion ? undefined : { y: [0, -5, 0, -3, 0] }}
                transition={{ duration: 3.6, delay: 1.0, ease: 'easeInOut' }}
              >
                {/* Bouncy 3D-Tilt Card Tile */}
                <motion.div
                  initial={
                    reducedMotion
                      ? { opacity: 0, scale: 0.95 }
                      : { y: 44, scale: 0.35, rotate: -18, opacity: 0 }
                  }
                  animate={
                    reducedMotion
                      ? { opacity: 1, scale: 1 }
                      : {
                          y: [44, -10, 0],
                          scale: [0.35, 1.12, 0.96, 1],
                          rotate: [-18, 6, -2, 0],
                          opacity: 1,
                        }
                  }
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-24 w-24 rounded-[26px] bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] shadow-[0_18px_38px_-10px_rgba(2,132,199,0.48)] flex items-center justify-center overflow-hidden"
                >
                  {/* Animated 3-Piece Kestrel Crest */}
                  <svg viewBox="0 0 108 108" className="h-24 w-24" fill="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="splash-wing-light" x1="46" y1="52" x2="80" y2="84" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#E0F2FE" />
                        <stop offset="100%" stopColor="#BAE6FD" />
                      </linearGradient>
                    </defs>

                    <motion.rect
                      x="29"
                      y="23"
                      width="14"
                      height="62"
                      rx="4.5"
                      fill="#FFFFFF"
                      initial={reducedMotion ? { opacity: 1 } : { y: -28, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.25 }}
                    />

                    <motion.path
                      d="M46.5 53.5L74.8 24.4C76.2 23 78.6 23.8 78.9 25.8L80.2 34.4C80.4 35.8 79.9 37.2 78.9 38.2L56.2 60.5L46.5 53.5Z"
                      fill="#FFFFFF"
                      initial={reducedMotion ? { opacity: 1 } : { x: 26, y: -18, opacity: 0 }}
                      animate={{ x: 0, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 20, delay: 0.42 }}
                    />

                    <motion.path
                      d="M46.5 53.5L57.8 49.8L79.5 80.5C80.6 82.1 79.5 84.3 77.5 84.3H68.2C66.8 84.3 65.5 83.6 64.7 82.4L46.5 53.5Z"
                      fill="url(#splash-wing-light)"
                      initial={reducedMotion ? { opacity: 1 } : { x: 24, y: 24, opacity: 0 }}
                      animate={{ x: 0, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 20, delay: 0.56 }}
                    />
                  </svg>

                  {/* Primary & Encore Light Sheen Sweeps */}
                  {!reducedMotion && (
                    <>
                      <motion.div
                        aria-hidden="true"
                        initial={{ x: '-140%', opacity: 0 }}
                        animate={{ x: '220%', opacity: [0, 0.85, 0] }}
                        transition={{ duration: 0.9, delay: 0.85, ease: 'easeInOut' }}
                        className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      />
                      <motion.div
                        aria-hidden="true"
                        initial={{ x: '-140%', opacity: 0 }}
                        animate={{ x: '220%', opacity: [0, 0.65, 0] }}
                        transition={{ duration: 0.95, delay: 2.9, ease: 'easeInOut' }}
                        className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-20 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                      />
                    </>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* Clean Wordmark Reveal */}
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 text-center"
            >
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0d1726] dark:text-[#f0f5fa]">
                Kestrel
              </h1>
              <p className="text-xs font-medium text-[#4a5a70] dark:text-[#92a4bc] mt-1 tracking-wide">
                Smart Cards &amp; Biometric Vault
              </p>
            </motion.div>

            {/* 5-Second Progress Indicator */}
            <div className="mt-6 w-36 h-1 rounded-full bg-[#dce4ee] dark:bg-[#213248] overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: reducedMotion ? 1.1 : 4.45,
                  delay: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: 'left center' }}
                className="h-full w-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
