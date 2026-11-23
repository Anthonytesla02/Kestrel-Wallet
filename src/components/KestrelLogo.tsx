import { useId } from 'react';

interface KestrelLogoProps {
  className?: string;
  withBackdrop?: boolean;
}

/**
 * Clean geometric Kestrel monogram emblem.
 * Uses bright Cobalt Sky (#0EA5E9 -> #0284C7) and crisp white shapes to match the light-first wallet palette.
 */
export function KestrelLogo({ className = 'h-8 w-8', withBackdrop = true }: KestrelLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bgId = `kestrel-bg-${uid}`;
  const lowerWingId = `kestrel-wing-${uid}`;

  return (
    <svg
      viewBox="0 0 108 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="12" y1="8" x2="96" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={lowerWingId} x1="46" y1="52" x2="80" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>

      {withBackdrop && (
        <rect x="2" y="2" width="104" height="104" rx="26" fill={`url(#${bgId})`} />
      )}

      {/* Left Spine */}
      <rect x="29" y="23" width="14" height="62" rx="4.5" fill="#FFFFFF" />

      {/* Upper Wing */}
      <path
        d="M46.5 53.5L74.8 24.4C76.2 23 78.6 23.8 78.9 25.8L80.2 34.4C80.4 35.8 79.9 37.2 78.9 38.2L56.2 60.5L46.5 53.5Z"
        fill="#FFFFFF"
      />

      {/* Lower Blade */}
      <path
        d="M46.5 53.5L57.8 49.8L79.5 80.5C80.6 82.1 79.5 84.3 77.5 84.3H68.2C66.8 84.3 65.5 83.6 64.7 82.4L46.5 53.5Z"
        fill={`url(#${lowerWingId})`}
      />
    </svg>
  );
}
