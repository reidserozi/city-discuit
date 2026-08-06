export type SiteClosedReason = 'sunday' | 'night';

export interface SiteStatus {
  closed: boolean;
  reason: SiteClosedReason | null;
}

const RALEIGH_TIME_ZONE = 'America/New_York';

// Allow test override via window.testDate for testing different times
function getEffectiveNow(): Date {
  if (typeof window !== 'undefined' && (window as any).testDate) {
    return new Date((window as any).testDate);
  }
  return new Date();
}

// Extract weekday and hour in Raleigh timezone (shared helper)
function getWeekdayAndHour(now: Date): { weekday: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RALEIGH_TIME_ZONE,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
  const hourPart = parts.find((p) => p.type === 'hour')?.value;
  const hour = hourPart ? parseInt(hourPart, 10) % 24 : 0;

  return { weekday, hour };
}

// Open Monday-Saturday, 6:00 AM - 10:00 PM Raleigh time. Closed all day Sunday.
export function getSiteStatus(now: Date = getEffectiveNow()): SiteStatus {
  const { weekday, hour } = getWeekdayAndHour(now);

  if (weekday === 'Sun') {
    return { closed: true, reason: 'sunday' };
  }

  if (hour < 6 || hour >= 22) {
    return { closed: true, reason: 'night' };
  }

  return { closed: false, reason: null };
}

// Digest window: Saturday 10 PM through Sunday 11:59 PM (to encourage weekend exploration)
export function isDigestWindow(now: Date = getEffectiveNow()): boolean {
  const { weekday, hour } = getWeekdayAndHour(now);
  return (weekday === 'Sat' && hour >= 22) || weekday === 'Sun';
}
