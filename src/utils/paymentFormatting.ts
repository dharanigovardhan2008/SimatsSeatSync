/**
 * Payment Formatting Utilities
 *
 * Handles currency formatting, date formatting, and text masking
 * for the checkout page
 */

/**
 * Format amount as INR currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format order ID for display (shorten if needed)
 */
export const formatOrderId = (orderId: string): string => {
  if (orderId.length <= 16) return orderId;
  return `${orderId.substring(0, 8)}...${orderId.substring(orderId.length - 4)}`;
};

/**
 * Format timestamp for transaction display
 */
export const formatTransactionDate = (date: Date | null): string => {
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

/**
 * Mask a string showing only first and last characters
 * Used for sensitive data display
 */
export const maskString = (str: string, showChars: number = 4): string => {
  if (str.length <= showChars * 2) return str;
  return `${str.substring(0, showChars)}${'•'.repeat(Math.max(1, str.length - showChars * 2))}${str.substring(str.length - showChars)}`;
};

/**
 * Validate UPI ID format
 * Format: name@bank or mobile@bank
 */
export const isValidUPIId = (upiId: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z]+$/;
  return upiRegex.test(upiId.trim().toLowerCase());
};
