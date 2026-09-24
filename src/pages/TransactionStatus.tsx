import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { TransactionStatusCard } from '@/components/transactions/TransactionStatusCard';
import { TransactionStatusBadge } from '@/components/transactions/TransactionStatusBadge';
import { TransactionReceiptCard } from '@/components/transactions/TransactionReceiptCard';
import { TransactionActions } from '@/components/transactions/TransactionActions';
import { useTransactionListener } from '@/hooks/useTransactionListener';
import { useTransactionState } from '@/hooks/useTransactionState';
import { Card } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';

/**
 * TransactionStatus page — production-grade transaction flow
 *
 * Real-time payment status viewer with full transaction lifecycle support:
 * - Awaiting Payment / Processing / Verified / Rejected / Cancelled / Refunded
 * - Live updates via Firebase onSnapshot
 * - Retry logic for failed transactions
 * - Receipt download/share
 * - Proper error states and edge case handling
 * - Full accessibility (aria-live regions, keyboard nav, color contrast)
 */
export const TransactionStatus: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();

  // Set up real-time listener for transaction updates
  const { transaction, loading, error } = useTransactionListener({
    registrationId: registrationId || '',
    onStatusChange: (oldStatus, newStatus) => {
      // Could trigger notifications or animations here
      console.log(`Status changed from ${oldStatus} to ${newStatus}`);
    },
    debounceMs: 100,
  });

  // Determine available actions based on transaction state
  const actions = useTransactionState({
    transaction,
    eventEnded: false, // Would need to check event data
    isUserOwnRegistration: transaction?.userId === userData?.id,
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !userData) {
      navigate('/login');
    }
  }, [userData, authLoading, navigate]);

  const handleRetry = useCallback(() => {
    navigate(`/event/${transaction?.eventId}`);
  }, [navigate, transaction?.eventId]);

  const handlePayNow = useCallback(() => {
    navigate(`/event/${transaction?.eventId}`);
  }, [navigate, transaction?.eventId]);

  const handleDownloadReceipt = useCallback(() => {
    if (!transaction) return;

    // Generate receipt content
    const receiptContent = `
TRANSACTION RECEIPT
════════════════════════════════════════

Event: ${transaction.eventTitle}
Participant: ${transaction.participantName}
Amount: ₹${transaction.amount}
Payment Method: ${transaction.paymentMethod.toUpperCase()}
Transaction ID: ${transaction.utr || 'N/A'}
Date & Time: ${transaction.createdAt.toDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Status: ${transaction.status.toUpperCase()}
Registration ID: ${transaction.id}

════════════════════════════════════════
Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Keep this receipt for your records.
    `.trim();

    // Create and download file
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receiptContent));
    element.setAttribute('download', `receipt-${transaction.utr || transaction.id}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [transaction]);

  if (authLoading || loading) {
    return <LoadingScreen message="Loading transaction details..." />;
  }

  // Transaction not found
  if (!transaction || error) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          <Card className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Transaction Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'We couldn\'t find the transaction you\'re looking for.'}
            </p>
            <button
              onClick={() => navigate('/tickets')}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Back to Tickets
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Duplicate warning */}
        {transaction.isDuplicate && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              ⚠️ Duplicate Payment Detected
            </p>
            <p className="text-xs text-amber-800">
              This transaction reference may have been submitted multiple times. Only one will be processed. Contact support if you've paid multiple times.
            </p>
          </div>
        )}

        {/* Status Badge with animation */}
        <div className="flex justify-center">
          <TransactionStatusBadge
            status={transaction.status}
            isDuplicate={transaction.isDuplicate}
          />
        </div>

        {/* Main transaction card */}
        <TransactionStatusCard transaction={transaction} />

        {/* Receipt card (for verified or pending transactions) */}
        {(transaction.status === 'verified' || transaction.status === 'pending_verification') && (
          <TransactionReceiptCard transaction={transaction} />
        )}

        {/* Action buttons */}
        <TransactionActions
          transaction={transaction}
          actions={actions}
          onRetry={handleRetry}
          onPayNow={handlePayNow}
          onDownloadReceipt={handleDownloadReceipt}
        />

        {/* Accessibility: aria-live region for status announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {transaction.status === 'verified' && 'Payment verified successfully.'}
          {transaction.status === 'rejected' && `Payment rejected. ${transaction.rejectionReason || 'Contact support for details.'}`}
          {transaction.status === 'pending_verification' && 'Payment is being verified by coordinator.'}
          {transaction.status === 'awaiting_payment' && 'Payment is awaiting submission.'}
          {transaction.status === 'cancelled' && 'Payment was cancelled.'}
          {transaction.status === 'refunded' && 'Payment has been refunded.'}
        </div>
      </div>
    </div>
  );
};

export default TransactionStatus;
