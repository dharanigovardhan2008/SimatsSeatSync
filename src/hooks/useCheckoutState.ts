import { useState, useCallback } from 'react';

type CheckoutState = 'idle' | 'loading' | 'processing' | 'success' | 'failed';

interface UseCheckoutStateReturn {
  state: CheckoutState;
  selectedMethod: string | null;
  orderId: string | null;
  transactionError: string | null;
  setMethod: (method: string | null) => void;
  submitPayment: (amount: number) => Promise<void>;
  resetError: () => void;
}

/**
 * useCheckoutState — State machine for checkout flow
 *
 * States:
 * - idle: Initial state, waiting for method selection
 * - loading: Fetching order data
 * - processing: Payment being processed by Razorpay
 * - success: Payment successful
 * - failed: Payment failed
 */
export const useCheckoutState = (
  eventId: string | undefined,
  userId: string | undefined
): UseCheckoutStateReturn => {
  const [state, setState] = useState<CheckoutState>('idle');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const setMethod = useCallback((method: string | null) => {
    setSelectedMethod(method);
    setTransactionError(null);
  }, []);

  const resetError = useCallback(() => {
    setTransactionError(null);
  }, []);

  const submitPayment = useCallback(async (amount: number) => {
    if (!selectedMethod || !eventId || !userId) {
      setTransactionError('Invalid payment setup');
      return;
    }

    try {
      setState('processing');
      setTransactionError(null);

      // TODO: Call Razorpay to create order and open checkout
      // For now, simulate with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock success - in real implementation, Razorpay callback will update this
      setState('success');
      setOrderId(`order_${Date.now()}`);
    } catch (err) {
      setState('failed');
      setTransactionError(
        err instanceof Error ? err.message : 'Payment processing failed'
      );
    }
  }, [selectedMethod, eventId, userId]);

  return {
    state,
    selectedMethod,
    orderId,
    transactionError,
    setMethod,
    submitPayment,
    resetError,
  };
};

export default useCheckoutState;
