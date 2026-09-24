import { Timestamp } from 'firebase/firestore';

/**
 * Format currency with locale awareness
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format timestamp to readable date string
 * Respects timezone from context or system preference
 */
export const formatTransactionDate = (
  timestamp: Timestamp | undefined,
  timezone: string = 'Asia/Kolkata'
): string => {
  if (!timestamp) return '—';

  try {
    const date = timestamp.toDate();

    const formatter = new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    });

    return formatter.format(date);
  } catch (err) {
    console.error('Date formatting error:', err);
    return '—';
  }
};

/**
 * Get relative time for transactions within 24 hours
 */
export const getRelativeTime = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return '';

  const now = new Date();
  const txDate = timestamp.toDate();
  const diffMs = now.getTime() - txDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return '';
};

/**
 * Format amount in words (for receipt)
 */
export const formatAmountInWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  if (amount === 0) return 'Zero';

  const convertTwoDigits = (num: number): string => {
    if (num === 0) return '';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
  };

  const convertThreeDigits = (num: number): string => {
    if (num === 0) return '';
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    let result = '';
    if (hundred > 0) {
      result = ones[hundred] + ' Hundred';
    }
    if (remainder > 0) {
      if (result) result += ' ';
      result += convertTwoDigits(remainder);
    }
    return result;
  };

  let result = '';
  let scaleIndex = 0;

  while (amount > 0) {
    const remainder = amount % 1000;
    if (remainder > 0) {
      const part = convertThreeDigits(remainder);
      if (scaleIndex > 0) {
        result = part + ' ' + scales[scaleIndex] + ' ' + result;
      } else {
        result = part;
      }
    }
    amount = Math.floor(amount / 1000);
    scaleIndex += 1;
  }

  return result.trim() + ' Rupees';
};

/**
 * Copy text to clipboard with fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Modern API
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('Copy to clipboard failed:', err);
    return false;
  }
};

/**
 * Generate share text for transaction
 */
export const generateShareText = (
  eventTitle: string,
  amount: number,
  utr: string,
  paymentMethod: string = 'UPI'
): string => {
  return `My registration for "${eventTitle}" is confirmed! ₹${amount} paid via ${paymentMethod}. Transaction ID: ${utr}`;
};

/**
 * Generate mailto link for support
 */
export const generateSupportMailto = (
  reason: string,
  utr: string,
  amount: number,
  eventTitle: string
): string => {
  const subject = encodeURIComponent(`Payment Issue - ${eventTitle}`);
  const body = encodeURIComponent(
    `Hi,\n\nI'm having an issue with my payment for ${eventTitle}.\n\n` +
    `Transaction ID: ${utr}\n` +
    `Amount: ₹${amount}\n` +
    `Reason: ${reason}\n\n` +
    `Please help me resolve this.\n\n` +
    `Thank you.`
  );

  return `mailto:support@seatsync.app?subject=${subject}&body=${body}`;
};

/**
 * Check if user is viewing their own transaction
 */
export const isOwnTransaction = (userId: string, transactionUserId: string): boolean => {
  return userId === transactionUserId;
};

/**
 * Validate retry preconditions
 */
export interface RetryValidation {
  canRetry: boolean;
  reason?: string;
}

export const validateRetry = (
  status: string,
  isDuplicate: boolean,
  eventEnded: boolean,
  userRegistered: boolean
): RetryValidation => {
  if (!userRegistered) {
    return { canRetry: false, reason: 'You are no longer registered for this event' };
  }

  if (isDuplicate) {
    return { canRetry: false, reason: 'Duplicate payments cannot be retried' };
  }

  if (eventEnded) {
    return { canRetry: false, reason: 'Event registration has ended' };
  }

  if (status !== 'rejected' && status !== 'cancelled') {
    return { canRetry: false, reason: 'This payment cannot be retried' };
  }

  return { canRetry: true };
};
