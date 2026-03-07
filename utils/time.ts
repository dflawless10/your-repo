import { format } from "date-fns";

// utils/time.ts
export function normalizeTimestamp(ts: string | undefined): string {
  if (!ts) return '';
  const trimmed = ts.trim();
  const hasT = trimmed.includes('T');
  const hasZ = trimmed.endsWith('Z') || trimmed.includes('+');

  if (hasT && hasZ) return trimmed; // already ISO UTC
  if (hasT && !hasZ) return trimmed + 'Z'; // ISO but missing Z
  return trimmed.replace(' ', 'T') + 'Z'; // naive → ISO UTC
}

export function calculateTimeLeft(registrationTime: string | undefined): string {
  if (!registrationTime) return 'Ended';
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

  // Show days + hours when more than 2 days left
  if (days >= 2) {
    return {
      timeText: `${days}d ${hours}h`,
      isUrgent: false,
    };
  }

  // Show hours/minutes/seconds ONLY when less than 48 hours
  const totalHours = Math.floor(ms / 3600000);
  const totalSeconds = Math.floor((ms % 3600000) / 1000);
  return {
    timeText: `${totalHours}h ${minutes}m ${seconds}s`,
    isUrgent: totalHours <= 24, // Red when 24 hours or less
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

export const formatTimeWithSeconds = (iso: string | undefined, now: number): string => {
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

  // Over 1 day: show just days and hours (clean)
  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  // Under 1 day: show full detail with hours, minutes, seconds (urgency!)
  return `${hours}h ${minutes}m ${seconds}s`;
};

// Format time WITHOUT seconds (cleaner for card displays)
export const formatTime = (iso: string | undefined, now: number): string => {
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

  // Show days + hours when more than 2 days left
  if (days >= 2) {
    return `${days}d ${hours}h`;
  }

  // Show hours/minutes when less than 48 hours
  const totalHours = Math.floor(diffMs / 3600000);
  return `${totalHours}h ${minutes}m`;
};

/**
 * Format shipping deadline time remaining in human-readable format
 * Handles both positive (time left) and negative (overdue) cases
 */
export const formatShippingTimeRemaining = (deadline: string | null | undefined, now?: number): string => {
  if (!deadline) return '';

  const parsed = deadline.endsWith('Z') || deadline.includes('+')
    ? new Date(deadline)
    : new Date(deadline + 'Z');

  if (isNaN(parsed.getTime())) return '';

  const currentTime = now || Date.now();
  const diffMs = parsed.getTime() - currentTime;
  const isLate = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  const days = Math.floor(absDiffMs / 86400000);
  const hours = Math.floor((absDiffMs % 86400000) / 3600000);
  const minutes = Math.floor((absDiffMs % 3600000) / 60000);

  // Format based on time scale
  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return isLate
      ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'} overdue`
      : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} left`;
  }

  if (days >= 2) {
    return isLate
      ? `${days} days overdue`
      : `${days} days left`;
  }

  if (days === 1) {
    return isLate
      ? `1 day overdue`
      : `1 day left`;
  }

  if (hours >= 2) {
    return isLate
      ? `${hours} hours overdue`
      : `${hours} hours left`;
  }

  if (hours === 1) {
    return isLate
      ? `1 hour overdue`
      : `1 hour left`;
  }

  // Less than 1 hour
  return isLate
    ? `${minutes} minutes overdue`
    : `${minutes} minutes left`;
};