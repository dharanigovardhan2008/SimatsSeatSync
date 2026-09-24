import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import { cn } from '@/utils/cn';
import { formatCurrency, formatTransactionDate, getRelativeTime } from '@/utils/transactionFormatting';
import type { TransactionData } from '@/hooks/useTransactionListener';

interface TransactionStatusCardProps {
  transaction: TransactionData | null;
  loading?: boolean;
  error?: string | null;
  timezone?: string;
}

/**
 * Main status card showing transaction state.
 *
 * Features:
 * - Status badge with animations
 * - Amount display with relative time
 * - Skeleton loader during fetch
 * - Error fallback
 * - Responsive layout
 */
export const TransactionStatusCard: React.FC<TransactionStatusCardProps> = ({
  transaction,
  loading = false,
  error = null,
  timezone = 'Asia/Kolkata',
}) => {
  const [animate, setAnimate] = useState(false);
  const [prevStatus, setPrevStatus] = useState(transaction?.status);

  useEffect(() => {
    if (transaction?.status && transaction.status !== prevStatus) {
      setAnimate(true);
      setPrevStatus(transaction.status);
      const timer = setTimeout(() => setAnimate(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [transaction?.status, prevStatus]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">
              Unable to Load Transaction
            </h3>
            <p className="text-sm text-red-800 mt-1">
              {error}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (loading || !transaction) {
    return (
      <Card>
        <div className="space-y-4">
          <Skeleton type="button" className="h-10 w-32" />
          <Skeleton type="line" className="h-8" />
          <Skeleton type="text-block" lines={2} />
        </div>
      </Card>
    );
  }

  const relativeTime = getRelativeTime(transaction.createdAt);
  const formattedDate = formatTransactionDate(transaction.createdAt, timezone);

  return (
    <Card className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <TransactionStatusBadge
          status={transaction.status}
          isDuplicate={transaction.isDuplicate}
        />
        {transaction.isDuplicate && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            Duplicate
          </span>
        )}
      </div>

      {/* Amount & Date Section */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-[#5E6C84]">Amount</span>
          <span className="text-4xl font-bold text-[#1D1D1F]">
            {formatCurrency(transaction.amount, transaction.currency)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A0AEC0] uppercase tracking-wide">
            {transaction.status === 'pending_verification' ? 'Submitted' : 'Date'}
          </span>
          <div className="text-right">
            <p className="font-semibold text-[#1D1D1F] text-sm">
              {formattedDate}
            </p>
            {relativeTime && (
              <p className="text-xs text-[#A0AEC0]">
                {relativeTime}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="bg-[#F9F9FB] rounded-lg p-4 border border-black/5">
        <StatusMessage status={transaction.status} rejectionReason={transaction.rejectionReason} />
      </div>

      {/* UTR Display (if available) */}
      {transaction.utr && (
        <div className="border-t border-black/5 pt-4">
          <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-2">
            Transaction ID
          </p>
          <code className="text-sm font-mono font-bold text-[#1D1D1F] bg-white border border-black/10 px-3 py-2 rounded-lg block">
            {transaction.utr}
          </code>
        </div>
      )}
    </Card>
  );
};

/**
 * Status-specific message component
 */
interface StatusMessageProps {
  status: TransactionData['status'];
  rejectionReason?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, rejectionReason }) => {
  switch (status) {
    case 'awaiting_payment':
      return (
        <div>
          <p className="font-semibold text-[#1D1D1F] text-sm">
            Payment Not Yet Submitted
          </p>
          <p className="text-xs text-[#5E6C84] mt-1">
            Click "Pay Now" to complete your registration payment using UPI.
          </p>
        </div>
      );
    case 'pending_verification':
      return (
        <div>
          <p className="font-semibold text-[#1D1D1F] text-sm">
            Awaiting Verification
          </p>
          <p className="text-xs text-[#5E6C84] mt-1">
            Your payment is being verified by a coordinator. This usually takes 1-2 hours during business hours.
          </p>
        </div>
      );
    case 'verified':
      return (
        <div>
          <p className="font-semibold text-green-900 text-sm">
            ✓ Payment Confirmed
          </p>
          <p className="text-xs text-green-800 mt-1">
            Your registration is now complete. Your ticket is ready in the Tickets section.
          </p>
        </div>
      );
    case 'rejected':
      return (
        <div>
          <p className="font-semibold text-red-900 text-sm">
            Payment Could Not Be Verified
          </p>
          <p className="text-xs text-red-800 mt-1">
            {rejectionReason
              ? `Reason: ${rejectionReason}. Please contact support or retry payment.`
              : 'Please contact support or retry payment.'}
          </p>
        </div>
      );
    case 'cancelled':
      return (
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            Payment Cancelled
          </p>
          <p className="text-xs text-gray-800 mt-1">
            You cancelled this payment. You can retry payment anytime to complete your registration.
          </p>
        </div>
      );
    case 'refunded':
      return (
        <div>
          <p className="font-semibold text-purple-900 text-sm">
            Payment Refunded
          </p>
          <p className="text-xs text-purple-800 mt-1">
            This payment has been refunded. The amount should appear in your account within 5-7 business days.
          </p>
        </div>
      );
    default:
      return null;
  }
};

export default TransactionStatusCard;
