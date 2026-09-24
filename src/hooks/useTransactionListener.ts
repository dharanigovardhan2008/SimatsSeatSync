import { useEffect, useRef, useCallback, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type PaymentStatus =
  | 'awaiting_payment'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

export interface TransactionData {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  utr: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rejectionReason?: string;
  eventId: string;
  eventTitle: string;
  participantName: string;
  paymentMethod: 'upi';
  userId: string;

  // Metadata
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

interface UseTransactionListenerOptions {
  registrationId: string;
  onStatusChange?: (oldStatus: PaymentStatus | null, newStatus: PaymentStatus) => void;
  debounceMs?: number;
}

/**
 * Real-time listener hook for transaction data.
 *
 * Features:
 * - Sets up Firebase onSnapshot listener
 * - Debounces rapid updates (100ms default)
 * - Handles cleanup on unmount
 * - Provides loading/error states
 * - Detects status changes for animations/notifications
 */
export const useTransactionListener = ({
  registrationId,
  onStatusChange,
  debounceMs = 100,
}: UseTransactionListenerOptions) => {
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<PaymentStatus | null>(null);

  const handleSnapshot = useCallback((snapshot: any) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce rapid updates
    debounceTimerRef.current = setTimeout(() => {
      try {
        if (!snapshot.exists()) {
          setError('Transaction not found');
          setTransaction(null);
          setLoading(false);
          return;
        }

        const data = snapshot.data() as Omit<TransactionData, 'id'>;
        const newTransaction: TransactionData = {
          id: snapshot.id,
          status: (data.status as PaymentStatus) || 'awaiting_payment',
          amount: data.amount || 0,
          currency: data.currency || 'INR',
          utr: data.utr || null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          rejectionReason: data.rejectionReason,
          eventId: data.eventId,
          eventTitle: data.eventTitle,
          participantName: data.participantName,
          paymentMethod: data.paymentMethod || 'upi',
          userId: data.userId,
          verifiedAt: data.verifiedAt,
          verifiedBy: data.verifiedBy,
          isDuplicate: data.isDuplicate,
          duplicateOf: data.duplicateOf,
        };

        // Detect status change
        if (previousStatusRef.current !== newTransaction.status) {
          onStatusChange?.(previousStatusRef.current, newTransaction.status);
          previousStatusRef.current = newTransaction.status;
        }

        setTransaction(newTransaction);
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to parse transaction';
        setError(errorMsg);
        setLoading(false);
      }
    }, debounceMs);
  }, [onStatusChange, debounceMs]);

  const handleError = useCallback((err: any) => {
    const errorMsg = err?.code === 'permission-denied'
      ? 'You do not have permission to view this transaction'
      : err instanceof Error ? err.message : 'Failed to load transaction';

    setError(errorMsg);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!registrationId) {
      setError('Registration ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transactionRef = doc(db, 'registrations', registrationId);
      unsubscribeRef.current = onSnapshot(
        transactionRef,
        handleSnapshot,
        handleError
      );
    } catch (err) {
      handleError(err);
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [registrationId, handleSnapshot, handleError]);

  return { transaction, loading, error };
};
