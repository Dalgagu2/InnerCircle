export const TIER_CONFIG: Record<number, { label: string; color: string; emoji: string; maxDays: number; bg: string; border: string }> = {
  1: { label: 'Inner Circle', color: '#E8364F', emoji: '❤️', maxDays: 3, bg: 'rgba(232,54,79,0.08)', border: 'rgba(232,54,79,0.25)' },
  2: { label: 'Close Friends', color: '#E87C36', emoji: '🔥', maxDays: 7, bg: 'rgba(232,124,54,0.08)', border: 'rgba(232,124,54,0.25)' },
  3: { label: 'Good Friends', color: '#E8C836', emoji: '☀️', maxDays: 14, bg: 'rgba(232,200,54,0.08)', border: 'rgba(232,200,54,0.25)' },
  4: { label: 'Casual Friends', color: '#36B5E8', emoji: '👋', maxDays: 30, bg: 'rgba(54,181,232,0.08)', border: 'rgba(54,181,232,0.25)' },
  5: { label: 'Acquaintances', color: '#8B7EC8', emoji: '🌐', maxDays: 90, bg: 'rgba(139,126,200,0.08)', border: 'rgba(139,126,200,0.25)' },
};

export const INTERACTION_TYPES = [
  '☕ Coffee/Meal',
  '📱 Call',
  '💬 Text/Chat',
  '🎉 Hangout',
  '🏢 Work',
  '📧 Email',
  '🎂 Event',
  '🤝 Other',
];

export const COLORS = {
  bg: '#0D0D12',
  surface: '#1A1A22',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#E8E6E1',
  textMuted: '#6B6760',
  textDark: '#4A4640',
  accent: '#E8364F',
  success: '#4ADE80',
  warning: '#E8C836',
  danger: '#E8364F',
  overdue: '#E87C36',
};
