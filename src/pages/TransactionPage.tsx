import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Card } from '@/components/ui/Card';
import { TransactionStatusCard } from './TransactionStatusCard';
import { TransactionReceiptCard } from './TransactionReceiptCard';
import { TransactionActions } from './TransactionActions';
import { useTransactionListener } from '@/hooks/useTransactionListener';
import { useTransactionState } from '@/hooks/useTransactionState';
import { getEventById } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

/**
 * Transaction/Payment Details Page
 *
 * Route: `/events/:eventId/transactions/:registrationId`
 *
 * Features:
 * - Real-time transaction status updates
 * - Comprehensive error handling
 * - Responsive layout (320px, 375px, 768px+)
 * - Accessibility support
 * - Permission checks
 * - Status-based CTAs
 *
 * Displays:
 * 1. Transaction status with animations
 * 2. Payment receipt/summary
 * 3. Contextual actions
 */
export const TransactionPage: React.FC = () => {
  const { eventId, registrationId } = useParams<{
    eventId: string;
    registrationId: string;
  }>();

  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<DocumentData | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  // Real-time transaction listener
  const { transaction, loading: txLoading, error: txError } = useTransactionListener({
    registrationId: registrationId || '',
    onStatusChange: (oldStatus, newStatus) => {
      // Show notification or trigger animations here
      console.log(`Status changed from ${oldStatus} to ${newStatus}`);
    },
  });

  // State machine for available actions
  const actions = useTransactionState({
    transaction,
    eventEnded: event?.registration_end_time && new Date(event.registration_end_time.toDate()) < new Date(),
    isUserOwnRegistration: transaction?.userId === userData?.uid,
  });

  // Load event details
  useEffect(() => {
    if (!eventId) {
      setEventError('Event ID is required');
      setEventLoading(false);
      return;
    }

    const loadEvent = async () => {
      try {
        setEventLoading(true);
        const eventData = await getEventById(eventId);
        if (!eventData) {
          setEventError('Event not found');
        } else {
          setEvent(eventData);
        }
      } catch (err) {
        setEventError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setEventLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Permission check: user must own this transaction or be admin
  useEffect(() => {
    if (!authLoading && userData) {
      const isOwner = transaction?.userId === userData.uid;
      const isAdmin = userData.role === 'admin';

      if (!isOwner && !isAdmin && transaction) {
        navigate('/');
      }
    }
  }, [userData, transaction, authLoading, navigate]);

  // Action handlers
  const handleRetry = useCallback(() => {
    // Navigate back to event with payment modal open
    navigate(`/events/${eventId}?openPayment=true`);
  }, [eventId, navigate]);

  const handlePayNow = useCallback(() => {
    // Navigate to event with payment modal open
    navigate(`/events/${eventId}?openPayment=true`);
  }, [eventId, navigate]);

  const handleDownloadReceipt = useCallback(async () => {
    if (!transaction) return;
    // This would typically call a backend function to generate PDF
    // For now, show a toast
    alert('Receipt download coming soon');
  }, [transaction]);

  // Loading state for entire page
  if (authLoading || eventLoading) {
    return <LoadingScreen />;
  }

  // Not authorized
  if (userData && transaction && transaction.userId !== userData.uid && userData.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] to-[#E8F0F7]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Access Denied</h1>
            <p className="text-[#5E6C84]">You don't have permission to view this transaction.</p>
            <button
              onClick={() => navigate('/')}
              className="text-[#3B9EFF] font-semibold hover:underline"
            >
              Go back home
            </button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] to-[#E8F0F7]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-[#3B9EFF] font-semibold text-sm mb-4 hover:underline flex items-center gap-1"
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-[#1D1D1F] mb-2">
            Transaction Details
          </h1>
          {transaction && (
            <p className="text-[#5E6C84]">
              {transaction.eventTitle}
            </p>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Column (Status + Receipt) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Status Card */}
            {txError && (
              <Card className="border-red-200 bg-red-50 p-6">
                <h2 className="font-semibold text-red-900 mb-2">Error Loading Transaction</h2>
                <p className="text-sm text-red-800">{txError}</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 text-red-700 font-semibold hover:underline text-sm"
                >
                  Go to home
                </button>
              </Card>
            )}

            {!txError && (
              <>
                <div>
                  <TransactionStatusCard
                    transaction={transaction}
                    loading={txLoading}
                    error={txError}
                  />
                </div>

                {/* Transaction Receipt Card */}
                {transaction && (
                  <div>
                    <TransactionReceiptCard transaction={transaction} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Secondary Column (Actions) */}
          <div className="lg:col-span-1">
            {transaction && (
              <TransactionActions
                transaction={transaction}
                actions={actions}
                onRetry={handleRetry}
                onPayNow={handlePayNow}
                onDownloadReceipt={handleDownloadReceipt}
                isLoading={txLoading}
              />
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Info */}
            {event && (
              <Card>
                <h3 className="font-bold text-[#1D1D1F] mb-3">Event Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5E6C84]">Event</span>
                    <span className="font-semibold text-[#1D1D1F]">{event.title}</span>
                  </div>
                  {event.date && (
                    <div className="flex justify-between">
                      <span className="text-[#5E6C84]">Date</span>
                      <span className="font-semibold text-[#1D1D1F]">
                        {new Date(event.date.toDate()).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Support Info */}
            <Card>
              <h3 className="font-bold text-[#1D1D1F] mb-3">Need Help?</h3>
              <div className="space-y-2 text-sm">
                <p className="text-[#5E6C84]">
                  If you have any questions about your payment or registration:
                </p>
                <div className="pt-2 space-y-2">
                  <a
                    href="mailto:support@seatsync.app"
                    className="text-[#3B9EFF] font-semibold hover:underline text-sm block"
                  >
                    support@seatsync.app
                  </a>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3B9EFF] font-semibold hover:underline text-sm block"
                  >
                    WhatsApp Support
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransactionPage;
