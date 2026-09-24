import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { copyToClipboard, formatCurrency, formatTransactionDate, formatAmountInWords } from '@/utils/transactionFormatting';
import type { TransactionData } from '@/hooks/useTransactionListener';

interface TransactionReceiptCardProps {
  transaction: TransactionData;
  timezone?: string;
}

/**
 * Receipt/summary card showing transaction details.
 *
 * Features:
 * - All transaction information in structured format
 * - Copy-to-clipboard for transaction ID (UTR)
 * - Responsive grid layout
 * - Toast notification on copy
 * - Print-friendly styling
 */
export const TransactionReceiptCard: React.FC<TransactionReceiptCardProps> = ({
  transaction,
  timezone = 'Asia/Kolkata',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUtr = async () => {
    if (!transaction.utr) return;
    const success = await copyToClipboard(transaction.utr);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const amountInWords = formatAmountInWords(transaction.amount);
  const formattedDate = formatTransactionDate(transaction.createdAt, timezone);

  return (
    <Card className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 pb-6">
        <h2 className="text-xl font-bold text-[#1D1D1F] mb-1">
          Payment Receipt
        </h2>
        <p className="text-sm text-[#5E6C84]">
          {formattedDate}
        </p>
      </div>

      {/* Event & Participant */}
      <div className="grid grid-cols-1 gap-6">
        {/* Event Name */}
        <div>
          <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
            Event
          </p>
          <p className="text-lg font-bold text-[#1D1D1F]">
            {transaction.eventTitle}
          </p>
        </div>

        {/* Payer Name */}
        <div>
          <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
            Participant
          </p>
          <p className="text-base font-semibold text-[#1D1D1F]">
            {transaction.participantName}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/5" />

      {/* Amount Section */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-[#5E6C84]">Amount</span>
          <span className="text-3xl font-bold text-[#1D1D1F]">
            {formatCurrency(transaction.amount, transaction.currency)}
          </span>
        </div>
        <p className="text-sm text-[#5E6C84] italic">
          {amountInWords}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-black/5" />

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction ID / UTR */}
        <div>
          <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
            Transaction ID (UTR)
          </p>
          <div className="flex items-center gap-2">
            <code className="text-base font-mono font-bold text-[#1D1D1F] bg-[#F9F9FB] px-3 py-2 rounded-lg flex-1">
              {transaction.utr || '—'}
            </code>
            {transaction.utr && (
              <button
                onClick={handleCopyUtr}
                className={cn(
                  'px-3 py-2 rounded-lg font-medium text-sm transition-all',
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#F9F9FB] text-[#1D1D1F] hover:bg-black/5'
                )}
                aria-label={copied ? 'Copied!' : 'Copy transaction ID'}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
            Payment Method
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F9F9FB] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1D1D1F]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 8H4V6h16m0 10H4v-2h16m0 6H4v-2h16z" />
              </svg>
            </div>
            <span className="font-semibold text-[#1D1D1F]">
              {transaction.paymentMethod === 'upi' ? 'UPI' : transaction.paymentMethod.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
            Date & Time
          </p>
          <p className="font-semibold text-[#1D1D1F]">
            {formattedDate}
          </p>
        </div>

        {/* Status */}
        <div>
          <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
            Status
          </p>
          <p className="font-semibold text-[#1D1D1F] capitalize">
            {transaction.status.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Verified By (if applicable) */}
        {transaction.verifiedBy && (
          <div>
            <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
              Verified By
            </p>
            <p className="font-semibold text-[#1D1D1F]">
              {transaction.verifiedBy}
            </p>
          </div>
        )}

        {/* Verified At (if applicable) */}
        {transaction.verifiedAt && (
          <div>
            <p className="text-xs font-semibold text-[#5E6C84] uppercase tracking-wide mb-1">
              Verified On
            </p>
            <p className="font-semibold text-[#1D1D1F]">
              {formatTransactionDate(transaction.verifiedAt, timezone)}
            </p>
          </div>
        )}
      </div>

      {/* Rejection Reason (if applicable) */}
      {transaction.rejectionReason && (
        <>
          <div className="border-t border-black/5" />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-1">
              Rejection Reason
            </p>
            <p className="text-sm text-red-800">
              {transaction.rejectionReason}
            </p>
          </div>
        </>
      )}

      {/* Footer Info */}
      <div className="border-t border-black/5 pt-6">
        <p className="text-xs text-[#A0AEC0] text-center">
          Keep this receipt for your records. For any discrepancies, contact support.
        </p>
      </div>
    </Card>
  );
};

export default TransactionReceiptCard;
