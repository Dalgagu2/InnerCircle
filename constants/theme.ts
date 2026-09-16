import { useColorScheme } from 'react-native';

export const TIER_CONFIG: Record<
  number,
  { label: string; color: string; lightTextColor?: string; maxDays: number; bg: string; border: string }
> = {
  1: { label: 'Inner Circle', color: '#E8364F', maxDays: 3, bg: 'rgba(232,54,79,0.08)', border: 'rgba(232,54,79,0.25)' },
  2: { label: 'Close Friends', color: '#E87C36', lightTextColor: '#C15A1C', maxDays: 7, bg: 'rgba(232,124,54,0.08)', border: 'rgba(232,124,54,0.25)' },
  3: { label: 'Good Friends', color: '#E8C836', lightTextColor: '#B08900', maxDays: 14, bg: 'rgba(232,200,54,0.08)', border: 'rgba(232,200,54,0.25)' },
  4: { label: 'Casual Friends', color: '#36B5E8', maxDays: 30, bg: 'rgba(54,181,232,0.08)', border: 'rgba(54,181,232,0.25)' },
  5: { label: 'Acquaintances', color: '#8B7EC8', maxDays: 90, bg: 'rgba(139,126,200,0.08)', border: 'rgba(139,126,200,0.25)' },
};

// Some tier colors (yellow especially) don't have enough contrast as small
// text on a light background, even though they read fine as icon/border
// accents. Use this for tier-colored TEXT specifically; use TIER_CONFIG's
// own `color` for icons, borders, and tinted backgrounds in both modes.
export function tierTextColor(tier: number, scheme: 'light' | 'dark'): string {
  const config = TIER_CONFIG[tier];
  if (!config) return '#000000';
  return scheme === 'light' && config.lightTextColor ? config.lightTextColor : config.color;
}

export const INTERACTION_TYPES = [
  'Coffee/Meal',
  'Call',
  'Text/Chat',
  'Hangout',
  'Work',
  'Email',
  'Event',
  'Other',
];

const DARK_COLORS = {
  bg: '#0D0D12',
  surface: '#1A1A22',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#E8E6E1',
  textMuted: '#6B6760',
  textDark: '#4A4640',
  accent: '#E8364F',
  success: '#4ADE80',
  warning: '#E8C836',
  danger: '#E8364F',
  overdue: '#E87C36',
  shadow: 'rgba(0,0,0,0.35)',
};

const LIGHT_COLORS = {
  bg: '#F7F6F4',
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(13,13,18,0.07)',
  text: '#1A1A1F',
  textMuted: '#746F68',
  textDark: '#A8A29B',
  accent: '#E8364F',
  success: '#22A15C',
  warning: '#B08900',
  danger: '#E8364F',
  overdue: '#D4661F',
  shadow: 'rgba(20,15,10,0.1)',
};

export type Colors = typeof DARK_COLORS;

// Kept for the rare call site outside a component (e.g. a module that can't
// use hooks); prefer useColors() everywhere else so the UI actually reacts
// to the system appearance changing.
export const COLORS: Colors = DARK_COLORS;

export function useColorSchemeName(): 'light' | 'dark' {
  return useColorScheme() === 'light' ? 'light' : 'dark';
}

export function useColors(): Colors {
  return useColorSchemeName() === 'light' ? LIGHT_COLORS : DARK_COLORS;
}
