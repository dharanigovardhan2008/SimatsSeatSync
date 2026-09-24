import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { getEventById } from '@/lib/firebase';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { SuccessModal } from '@/components/checkout/SuccessModal';
import { FailureModal } from '@/components/checkout/FailureModal';
import { useCheckoutState } from '@/hooks/useCheckoutState';
import type { DocumentData } from 'firebase/firestore';

/**
 * CheckoutPage — Razorpay-style premium checkout experience
 *
 * Features:
 * - Order summary with real event data from Firestore
 * - UPI + QR payment method selection
 * - Razorpay pre-built checkout UI (modal or embedded)
 * - Success modal with checkmark animation + celebratory sound
 * - Failure modal with specific error messages
 * - Real-time transaction tracking
 * - Fully responsive (320px-1024px+)
 * - WCAG AA accessibility
 */
export const CheckoutPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<DocumentData | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState<string>('');

  const {
    state,
    selectedMethod,
    orderId,
    transactionError,
    setMethod,
    submitPayment,
    resetError,
  } = useCheckoutState(eventId, userData?.id);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !userData) {
      navigate('/login');
    }
  }, [userData, authLoading, navigate]);

  // Fetch event details
  useEffect(() => {
    if (!eventId) return;

    const loadEvent = async () => {
      try {
        setEventLoading(true);
        setEventError('');
        const eventData = await getEventById(eventId);
        if (!eventData) {
          setEventError('Event not found');
          setEventLoading(false);
          return;
        }
        setEvent(eventData);
      } catch (err) {
        setEventError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setEventLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Redirect on success
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        navigate('/tickets');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  if (authLoading || eventLoading) {
    return <LoadingScreen message="Preparing your checkout..." />;
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
            <p className="text-gray-600 mb-6">{eventError || 'Unable to load event details'}</p>
            <button
              onClick={() => navigate('/student')}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Main Grid: Order Summary (left) + Payment Methods (right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Summary - Sticky on desktop */}
          <div className="md:col-span-1">
            <OrderSummary
              event={event}
              student={userData}
              amount={event.registration_fee || 0}
            />
          </div>

          {/* Payment Method Selector - Main content area */}
          <div className="md:col-span-2">
            <PaymentMethodSelector
              amount={event.registration_fee || 0}
              eventTitle={event.title}
              selectedMethod={selectedMethod}
              onMethodSelect={setMethod}
              isProcessing={state === 'processing'}
              error={transactionError}
              onErrorDismiss={resetError}
            />
          </div>
        </div>

        {/* Checkout Footer - Sticky button */}
        <CheckoutFooter
          amount={event.registration_fee || 0}
          selectedMethod={selectedMethod}
          isProcessing={state === 'processing'}
          isDisabled={state === 'processing' || !selectedMethod}
          onSubmit={() => submitPayment(event.registration_fee || 0)}
        />
      </div>

      {/* Success Modal */}
      {state === 'success' && (
        <SuccessModal
          amount={event.registration_fee || 0}
          orderId={orderId || ''}
          eventTitle={event.title}
        />
      )}

      {/* Failure Modal */}
      {state === 'failed' && (
        <FailureModal
          error={transactionError || 'Payment failed'}
          onRetry={() => setMethod(null)}
          onDifferentMethod={() => {
            resetError();
            setMethod(null);
          }}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
