import { TIER_CONFIG } from '../constants/theme';

export function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatDays(days: number): string {
  if (days === Infinity) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function urgencyLevel(days: number, maxDays: number): 'critical' | 'overdue' | 'soon' | 'ok' {
  const ratio = days / maxDays;
  if (ratio >= 1.5) return 'critical';
  if (ratio >= 1) return 'overdue';
  if (ratio >= 0.7) return 'soon';
  return 'ok';
}

export function urgencyColor(status: string): string {
  switch (status) {
    case 'critical': return '#E8364F';
    case 'overdue': return '#E87C36';
    case 'soon': return '#E8C836';
    default: return '#4ADE80';
  }
}

export function getUrgencyForContact(lastInteraction: string | null, tier: number) {
  const days = daysSince(lastInteraction);
  const maxDays = TIER_CONFIG[tier]?.maxDays || 30;
  const status = urgencyLevel(days, maxDays);
  const color = urgencyColor(status);
  const progress = Math.min(days / maxDays, 2);
  return { days, status, color, progress, maxDays };
}

export function sortByUrgency(contacts: any[]) {
  return [...contacts].sort((a, b) => {
    const aRatio = daysSince(a.lastInteraction) / (TIER_CONFIG[a.tier]?.maxDays || 30);
    const bRatio = daysSince(b.lastInteraction) / (TIER_CONFIG[b.tier]?.maxDays || 30);
    return bRatio - aRatio;
  });
}
