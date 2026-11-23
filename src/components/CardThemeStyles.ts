import type { CardTheme } from '../types/wallet';

export interface CardThemeMeta {
  id: CardTheme;
  label: string;
  swatchClass: string;
  surfaceClass: string;
  textClass: string;
  mutedTextClass: string;
  scrimClass: string;
  imageUrl?: string;
}

export const CARD_THEMES: Record<CardTheme, CardThemeMeta> = {
  'arctic-cobalt': {
    id: 'arctic-cobalt',
    label: 'Arctic Cobalt',
    swatchClass: 'bg-gradient-to-br from-sky-600 via-blue-700 to-slate-900',
    surfaceClass: 'bg-gradient-to-br from-sky-700 via-blue-800 to-slate-950',
    textClass: 'text-white',
    mutedTextClass: 'text-sky-100/80',
    scrimClass: 'bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-slate-900/30',
    imageUrl: '/src/assets/images/card_arctic_cobalt_1795437225759.jpg',
  },
  'glacial-teal': {
    id: 'glacial-teal',
    label: 'Glacial Teal',
    swatchClass: 'bg-gradient-to-br from-teal-700 via-cyan-800 to-slate-900',
    surfaceClass: 'bg-gradient-to-br from-teal-800 via-cyan-900 to-slate-950',
    textClass: 'text-white',
    mutedTextClass: 'text-cyan-100/80',
    scrimClass: 'bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-slate-900/25',
    imageUrl: '/src/assets/images/card_glacial_teal_1795437225607.jpg',
  },
  'frosted-titanium': {
    id: 'frosted-titanium',
    label: 'Frosted Titanium',
    swatchClass: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400',
    surfaceClass:
      'bg-[linear-gradient(135deg,#e2e8f0_0%,#cbd5e1_38%,#dbeafe_72%,#94a3b8_100%)]',
    textClass: 'text-slate-900',
    mutedTextClass: 'text-slate-700',
    scrimClass: 'bg-gradient-to-br from-white/30 via-transparent to-slate-400/20',
  },
  'deep-slate': {
    id: 'deep-slate',
    label: 'Deep Slate',
    swatchClass: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950',
    surfaceClass:
      'bg-[linear-gradient(135deg,#1e293b_0%,#0f172a_55%,#020617_100%)]',
    textClass: 'text-slate-50',
    mutedTextClass: 'text-slate-300/85',
    scrimClass: 'bg-[radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.18),transparent_55%)]',
  },
  'midnight-indigo': {
    id: 'midnight-indigo',
    label: 'Midnight Indigo',
    swatchClass: 'bg-gradient-to-br from-indigo-700 via-slate-900 to-sky-950',
    surfaceClass:
      'bg-[linear-gradient(135deg,#1e1b4b_0%,#0f172a_52%,#0c4a6e_100%)]',
    textClass: 'text-white',
    mutedTextClass: 'text-indigo-100/80',
    scrimClass: 'bg-[radial-gradient(circle_at_20%_85%,rgba(56,189,248,0.22),transparent_50%)]',
  },
  'nordic-mist': {
    id: 'nordic-mist',
    label: 'Nordic Mist',
    swatchClass: 'bg-gradient-to-br from-sky-100 via-slate-100 to-cyan-200',
    surfaceClass:
      'bg-[linear-gradient(135deg,#f8fafc_0%,#e0f2fe_52%,#cbd5e1_100%)]',
    textClass: 'text-slate-900',
    mutedTextClass: 'text-slate-600',
    scrimClass: 'bg-gradient-to-tr from-sky-200/30 via-transparent to-white/40',
  },
};

export const CARD_THEME_LIST = Object.values(CARD_THEMES);
