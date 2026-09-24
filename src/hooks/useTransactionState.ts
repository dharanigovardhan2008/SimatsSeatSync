import { useCallback, useMemo } from 'react';
import type { PaymentStatus, TransactionData } from './useTransactionListener';

export interface TransactionActions {
  canRetry: boolean;
  canPayNow: boolean;
  canDownloadReceipt: boolean;
  canShare: boolean;
  canContactSupport: boolean;
  isPending: boolean;
  isVerified: boolean;
  isFailed: boolean;
  showDuplicateWarning: boolean;
}

interface UseTransactionStateOptions {
  transaction: TransactionData | null;
  eventEnded?: boolean;
  isUserOwnRegistration?: boolean;
}

/**
 * State machine hook for transaction logic.
 *
 * Determines available actions based on current transaction state,
 * event status, and user permissions.
 */
export const useTransactionState = ({
  transaction,
  eventEnded = false,
  isUserOwnRegistration = true,
}: UseTransactionStateOptions): TransactionActions => {
  return useMemo(() => {
    if (!transaction || !isUserOwnRegistration) {
      return {
        canRetry: false,
        canPayNow: false,
        canDownloadReceipt: false,
        canShare: false,
        canContactSupport: false,
        isPending: false,
        isVerified: false,
        isFailed: false,
        showDuplicateWarning: false,
      };
    }

    const status = transaction.status;
    const isDuplicate = transaction.isDuplicate;
    const hasUtr = !!transaction.utr;

    return {
      // Retry: only if rejected/cancelled and event not ended
      canRetry: (status === 'rejected' || status === 'cancelled') && !eventEnded && !isDuplicate,

      // Pay now: if awaiting payment (only initial state)
      canPayNow: status === 'awaiting_payment' && !eventEnded,

      // Download receipt: only if verified
      canDownloadReceipt: status === 'verified' && hasUtr,

      // Share: if verified or has valid transaction ID
      canShare: status === 'verified' && hasUtr,

      // Contact support: if failed or rejected
      canContactSupport: (status === 'rejected' || status === 'cancelled') && !isDuplicate,

      // Pending state indicator
      isPending: status === 'pending_verification',

      // Verified state indicator
      isVerified: status === 'verified',

      // Failed state indicator (rejected or cancelled)
      isFailed: status === 'rejected' || status === 'cancelled',

      // Show duplicate warning
      showDuplicateWarning: isDuplicate === true,
    };
  }, [transaction, eventEnded, isUserOwnRegistration]);
};

/**
 * Get status badge styling and text
 */
export const getStatusBadgeStyle = (status: PaymentStatus, isDuplicate: boolean) => {
  if (isDuplicate) {
    return {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      badgeColor: 'bg-amber-100',
      label: 'Duplicate Payment',
      description: 'This payment has already been processed',
    };
  }

  const styles: Record<PaymentStatus, {
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeColor: string;
    label: string;
    description: string;
  }> = {
    awaiting_payment: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      badgeColor: 'bg-blue-100',
      label: 'Awaiting Payment',
      description: 'Payment not yet submitted',
    },
    pending_verification: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      badgeColor: 'bg-amber-100',
      label: 'Pending Verification',
      description: 'Awaiting coordinator confirmation',
    },
    verified: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      badgeColor: 'bg-green-100',
      label: 'Payment Verified',
      description: 'Your payment has been confirmed',
    },
    rejected: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      badgeColor: 'bg-red-100',
      label: 'Payment Rejected',
      description: 'Your payment could not be verified',
    },
    cancelled: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-900',
      badgeColor: 'bg-gray-100',
      label: 'Payment Cancelled',
      description: 'You cancelled this payment',
    },
    refunded: {
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-900',
      badgeColor: 'bg-purple-100',
      label: 'Refunded',
      description: 'Your payment has been refunded',
    },
  };

  return styles[status];
};

/**
 * Get status icon component type
 */
export const getStatusIconType = (status: PaymentStatus, isDuplicate: boolean) => {
  if (isDuplicate) return 'alert';
  switch (status) {
    case 'awaiting_payment':
      return 'clock';
    case 'pending_verification':
      return 'spinner';
    case 'verified':
      return 'checkmark';
    case 'rejected':
      return 'x';
    case 'cancelled':
      return 'x';
    case 'refunded':
      return 'reply';
    default:
      return 'info';
  }
};
