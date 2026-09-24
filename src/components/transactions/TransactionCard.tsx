import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { TransactionStatus } from '@/pages/TransactionStatus';

interface TransactionData {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  amount: number;
  paymentMethod: 'upi';
  transactionId: string;
  participantName: string;
  timestamp: Date | null;
  status: TransactionStatus;
  rejectionReason?: string;
}

interface TransactionCardProps {
  transaction: TransactionData;
}

const getStatusConfig = (status: TransactionStatus) => {
  switch (status) {
    case 'success':
      return {
        icon: CheckCircle,
        label: 'Payment Verified',
        color: 'text-[#34C759]',
        bgColor: 'bg-[#34C759]/10',
        borderColor: 'border-[#34C759]/20',
        badgeColor: 'bg-[#34C759]/20 text-[#34C759]',
      };
    case 'failed':
      return {
        icon: XCircle,
        label: 'Payment Rejected',
        color: 'text-[#FF3B30]',
        bgColor: 'bg-[#FF3B30]/10',
        borderColor: 'border-[#FF3B30]/20',
        badgeColor: 'bg-[#FF3B30]/20 text-[#FF3B30]',
      };
    case 'processing':
      return {
        icon: Clock,
        label: 'Verifying Payment',
        color: 'text-[#FF9500]',
        bgColor: 'bg-[#FF9500]/10',
        borderColor: 'border-[#FF9500]/20',
        badgeColor: 'bg-[#FF9500]/20 text-[#FF9500]',
      };
    case 'pending':
      return {
        icon: AlertCircle,
        label: 'Payment Pending',
        color: 'text-[#3B9EFF]',
        bgColor: 'bg-[#3B9EFF]/10',
        borderColor: 'border-[#3B9EFF]/20',
        badgeColor: 'bg-[#3B9EFF]/20 text-[#3B9EFF]',
      };
    default:
      return {
        icon: AlertCircle,
        label: 'Status Unknown',
        color: 'text-[#5E6C84]',
        bgColor: 'bg-[#5E6C84]/10',
        borderColor: 'border-[#5E6C84]/20',
        badgeColor: 'bg-[#5E6C84]/20 text-[#5E6C84]',
      };
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | null): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata', // IST
  }).format(date);
};

/**
 * Main transaction status card showing the most important info at a glance:
 * - Status icon and label (color-coded)
 * - Amount
 * - Event name
 * - Participant name
 */
export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;

  // Pulse animation for processing state
  const isPulsing = transaction.status === 'processing';

  return (
    <div className="mb-8">
      <Card className="border-2" hover={false}>
        <div className="space-y-6">
          {/* Status Section */}
          <div className={`p-6 rounded-3xl ${statusConfig.bgColor} border ${statusConfig.borderColor} transition-all ${
            isPulsing ? 'animate-pulse' : ''
          }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-extrabold ${statusConfig.color} tracking-tight`}>
                  {statusConfig.label}
                </h2>
                {transaction.status === 'processing' && (
                  <p className="text-sm text-[#5E6C84] mt-1">
                    A coordinator is reviewing your payment. This usually takes a few minutes.
                  </p>
                )}
                {transaction.status === 'pending' && (
                  <p className="text-sm text-[#5E6C84] mt-1">
                    Complete your payment to register for this event.
                  </p>
                )}
                {transaction.status === 'success' && (
                  <p className="text-sm text-[#34C759] mt-1">
                    Your ticket is ready to use!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-black/5">
              <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-1">
                Amount
              </p>
              <p className="text-2xl font-extrabold text-[#1D1D1F] tabular-nums">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-black/5">
              <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-1">
                Payment Method
              </p>
              <p className="text-lg font-semibold text-[#1D1D1F]">
                UPI
              </p>
            </div>

            {/* Event */}
            <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-black/5 sm:col-span-2">
              <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-1">
                Event
              </p>
              <p className="text-base font-semibold text-[#1D1D1F] truncate">
                {transaction.eventTitle}
              </p>
            </div>

            {/* Participant Name */}
            <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-black/5">
              <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-1">
                Participant
              </p>
              <p className="text-base font-semibold text-[#1D1D1F] truncate">
                {transaction.participantName}
              </p>
            </div>

            {/* Timestamp */}
            <div className="p-4 rounded-2xl bg-[#F9F9FB] border border-black/5">
              <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-1">
                Date & Time
              </p>
              <p className="text-sm font-mono text-[#1D1D1F]">
                {formatDate(transaction.timestamp)}
              </p>
            </div>
          </div>

          {/* Transaction ID Section */}
          <div className="pt-4 border-t border-black/5">
            <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-2">
              Transaction ID (UTR)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2.5 rounded-xl bg-[#F9F9FB] border border-black/5 font-mono text-sm text-[#1D1D1F] break-all">
                {transaction.transactionId || '—'}
              </code>
              {transaction.transactionId && (
                <CopyButton text={transaction.transactionId} />
              )}
            </div>
            {transaction.transactionId && (
              <p className="text-xs text-[#5E6C84] mt-2">
                Keep this reference for your records. Use it to track your payment with your bank.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

/**
 * Copy-to-clipboard button with visual feedback
 */
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
        copied
          ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20'
          : 'bg-[#3B9EFF]/10 text-[#3B9EFF] border border-[#3B9EFF]/20 hover:bg-[#3B9EFF]/20'
      }`}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

export default TransactionCard;
