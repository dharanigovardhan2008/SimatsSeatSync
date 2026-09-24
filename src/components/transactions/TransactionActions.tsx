import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { generateShareText, generateSupportMailto } from '@/utils/transactionFormatting';
import type { TransactionData } from '@/hooks/useTransactionListener';
import type { TransactionActions } from '@/hooks/useTransactionState';

interface TransactionActionsProps {
  transaction: TransactionData;
  actions: TransactionActions;
  onRetry: () => void;
  onPayNow: () => void;
  onDownloadReceipt: () => void;
  onShare?: () => void;
  isLoading?: boolean;
}

/**
 * Contextual action buttons based on transaction state.
 *
 * Features:
 * - Conditional button visibility
 * - Loading states
 * - Keyboard accessible
 * - Share options (copy link, email, WhatsApp)
 * - Support contact link
 */
export const TransactionActions: React.FC<TransactionActionsProps> = ({
  transaction,
  actions,
  onRetry,
  onPayNow,
  onDownloadReceipt,
  onShare,
  isLoading = false,
}) => {
  const [shareOpen, setShareOpen] = useState(false);

  const handleShare = async (method: 'copy' | 'email' | 'whatsapp') => {
    const shareText = generateShareText(
      transaction.eventTitle,
      transaction.amount,
      transaction.utr || '',
      transaction.paymentMethod
    );

    switch (method) {
      case 'copy': {
        try {
          await navigator.clipboard.writeText(shareText);
          // Show toast
          alert('Copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        break;
      }
      case 'email': {
        const subject = encodeURIComponent(`My registration for ${transaction.eventTitle}`);
        const body = encodeURIComponent(shareText);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        break;
      }
      case 'whatsapp': {
        const text = encodeURIComponent(shareText);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        break;
      }
    }

    setShareOpen(false);
    onShare?.();
  };

  const handleContactSupport = () => {
    const supportMailto = generateSupportMailto(
      transaction.rejectionReason || 'Payment verification failed',
      transaction.utr || 'N/A',
      transaction.amount,
      transaction.eventTitle
    );
    window.open(supportMailto, '_blank');
  };

  return (
    <Card className="space-y-4">
      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pay Now Button */}
        {actions.canPayNow && (
          <Button
            variant="primary"
            size="md"
            onClick={onPayNow}
            disabled={isLoading}
            className="w-full"
            aria-label={`Pay ₹${transaction.amount} for ${transaction.eventTitle}`}
          >
            Pay Now
          </Button>
        )}

        {/* Retry Payment Button */}
        {actions.canRetry && (
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            disabled={isLoading}
            className="w-full"
            aria-label={`Retry payment of ₹${transaction.amount}`}
          >
            Retry Payment
          </Button>
        )}

        {/* Download Receipt Button */}
        {actions.canDownloadReceipt && (
          <Button
            variant="secondary"
            size="md"
            onClick={onDownloadReceipt}
            disabled={isLoading}
            className="w-full"
            aria-label="Download payment receipt as PDF"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Receipt
          </Button>
        )}

        {/* Share Button */}
        {actions.canShare && (
          <div className="relative">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShareOpen(!shareOpen)}
              disabled={isLoading}
              className="w-full"
              aria-label="Share payment receipt"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.322 10.923 11.85 9 14.5 9c.44 0 .873.023 1.299.065M15 19H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Share Receipt
            </Button>

            {/* Share Menu */}
            {shareOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-black/10 z-20 min-w-[200px] overflow-hidden">
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-[#1D1D1F] hover:bg-[#F9F9FB] transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-[#1D1D1F] hover:bg-[#F9F9FB] transition-colors border-t border-black/5"
                >
                  Email
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-[#1D1D1F] hover:bg-[#F9F9FB] transition-colors border-t border-black/5"
                >
                  WhatsApp
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact Support Button */}
      {actions.canContactSupport && (
        <Button
          variant="danger"
          size="md"
          onClick={handleContactSupport}
          disabled={isLoading}
          className="w-full"
          aria-label="Contact support for payment issues"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Contact Support
        </Button>
      )}

      {/* Info Messages */}
      {actions.showDuplicateWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            Duplicate Payment Detected
          </p>
          <p className="text-xs text-amber-800">
            This payment has already been processed. If you've paid multiple times, please contact support for a refund.
          </p>
        </div>
      )}

      {actions.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            Awaiting Coordinator Verification
          </p>
          <p className="text-xs text-blue-800">
            Your payment is being verified. We'll notify you once it's confirmed. This usually takes 1-2 hours during business hours.
          </p>
        </div>
      )}

      {actions.isFailed && transaction.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-900 mb-1">
            Why Was This Rejected?
          </p>
          <p className="text-xs text-red-800">
            {transaction.rejectionReason}
          </p>
        </div>
      )}
    </Card>
  );
};

export default TransactionActions;
