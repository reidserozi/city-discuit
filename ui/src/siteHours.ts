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

// Open Monday-Saturday, 8:00 AM - 10:00 PM Raleigh time. Closed all day Sunday.
export function getSiteStatus(now: Date = getEffectiveNow()): SiteStatus {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RALEIGH_TIME_ZONE,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hourPart = parts.find((p) => p.type === 'hour')?.value;
  const hour = hourPart ? parseInt(hourPart, 10) % 24 : 0;

  if (weekday === 'Sun') {
    return { closed: true, reason: 'sunday' };
  }

  if (hour < 8 || hour >= 22) {
    return { closed: true, reason: 'night' };
  }

  return { closed: false, reason: null };
}
