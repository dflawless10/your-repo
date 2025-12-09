import { format, formatDistanceToNow, isValid } from 'date-fns';

/**
 * Format a price value as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a date string to a human-readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (!isValid(date)) {
    return 'Invalid date';
  }
  return format(date, 'MMM d, yyyy h:mm a');
};

/**
 * Format time remaining in a human-readable format
 */
export const formatTimeRemaining = (dateString: string): string => {
  const date = new Date(dateString);
  if (!isValid(date)) {
    return 'Unknown time';
  }

  if (date < new Date()) {
    return 'Ended';
  }

  return formatDistanceToNow(date, { addSuffix: true });
};
