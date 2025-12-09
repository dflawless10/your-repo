import { format } from "date-fns";

// utils/time.ts
export function normalizeTimestamp(ts: string): string {
  if (!ts) return '';
  const trimmed = ts.trim();
  const hasT = trimmed.includes('T');
  const hasZ = trimmed.endsWith('Z') || trimmed.includes('+');

  if (hasT && hasZ) return trimmed; // already ISO UTC
  if (hasT && !hasZ) return trimmed + 'Z'; // ISO but missing Z
  return trimmed.replace(' ', 'T') + 'Z'; // naive → ISO UTC
}

export function calculateTimeLeft(registrationTime: string): string {
  const start = new Date(registrationTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export const getCountdownColor = (countdown: string) => {
  const match = new RegExp(/(\d+)h/).exec(countdown);
  const hoursLeft = match ? Number.parseInt(match[1], 10) : 0;
  return {
    color: hoursLeft <= 2 ? '#e53e3e' : '#38a169', // red if ≤2h, green otherwise
    fontWeight: '600' as const,
  };
};


export const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return 'Unknown';
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) return 'Invalid date';
  return format(parsed, 'PPP'); // or 'PPpp' for full date + time
};

export const getCountdownLocal = (endTime?: string): {
  timeText: string;
  isUrgent: boolean;
} => {
  if (!endTime) return { timeText: '', isUrgent: false };

  const safe = normalizeTimestamp(endTime);
const end = new Date(safe);
  if (isNaN(end.getTime())) return { timeText: 'Invalid time', isUrgent: false };

  const ms = end.getTime() - Date.now();
  if (ms <= 0) return { timeText: 'Ended', isUrgent: true };

  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  // Show days when more than 4 days left
  if (days > 4) {
    return {
      timeText: `${days}d ${hours}h`,
      isUrgent: false,
    };
  }

  // Show hours when 4 days or less
  const totalHours = Math.floor(ms / 3600000);
  return {
    timeText: `${totalHours}h ${minutes}m`,
    isUrgent: totalHours < 2,
  };
};

export function isEndingSoon(targetTime?: string, thresholdHours = 24): boolean {
  if (!targetTime) return false;
  const ms = new Date(targetTime).getTime() - Date.now();
  return ms < thresholdHours * 3600000;
}

export function getRegistrationCountdown(registration_time?: string): {
  timeText: string;
  isUrgent: boolean;
} {
  if (!registration_time) {
    return { timeText: 'Invalid registration time', isUrgent: false };
  }

  const safe = normalizeTimestamp(registration_time);
const start = new Date(safe);
  if (isNaN(start.getTime())) {
    return { timeText: 'Invalid registration time', isUrgent: false };
  }

  const end = new Date(start.getTime() + 3600000); // 1-hour window
  return getCountdownLocal(end.toISOString());
}

export function isLowStock(quantity?: number, threshold = 5): boolean {
  return typeof quantity === 'number' && quantity <= threshold;
}

export const formatTimeWithSeconds = (iso: string, now: number): string => {
  if (!iso) return "Auction ended";

  const parsed = iso.endsWith('Z') || iso.includes('+')
    ? new Date(iso)
    : new Date(iso + 'Z');

  if (isNaN(parsed.getTime())) return "Auction ended";

  const diffMs = parsed.getTime() - now;
  if (diffMs <= 0) return "Auction ended";

  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  // Show days when more than 4 days left
  if (days > 4) {
    return `${days}d ${hours}h left`;
  }

  // Show hours when 4 days or less
  const totalHours = Math.floor(diffMs / 3600000);
  return `${totalHours}h ${minutes}m ${seconds}s left`;
};