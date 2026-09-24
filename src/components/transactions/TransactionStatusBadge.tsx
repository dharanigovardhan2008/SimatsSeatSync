import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import type { PaymentStatus } from '@/hooks/useTransactionListener';
import { getStatusBadgeStyle } from '@/hooks/useTransactionState';

interface TransactionStatusBadgeProps {
  status: PaymentStatus;
  isDuplicate?: boolean;
  onAnimationComplete?: () => void;
}

/**
 * Status badge with icon and animations.
 *
 * Animations:
 * - Checkmark scale-up on success
 * - Shake on failure
 * - Pulse on pending
 */
export const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({
  status,
  isDuplicate = false,
  onAnimationComplete,
}) => {
  const [animate, setAnimate] = useState(false);
  const style = getStatusBadgeStyle(status, isDuplicate);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 1200);

    return () => clearTimeout(timer);
  }, [status, onAnimationComplete]);

  const getIcon = () => {
    if (isDuplicate) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      );
    }

    switch (status) {
      case 'verified':
        return (
          <svg
            className={cn(
              'w-6 h-6 transition-transform duration-300',
              animate ? 'scale-100' : 'scale-0'
            )}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case 'pending_verification':
        return (
          <svg
            className={cn(
              'w-6 h-6',
              animate && 'animate-spin'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <svg
            className={cn(
              'w-6 h-6 transition-transform',
              animate && 'animate-shake'
            )}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'awaiting_payment':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.99 5V1h-12v4h-4v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7h-2zm-6 10h-2v-2h2v2zm0-4h-2V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z" />
          </svg>
        );
      case 'refunded':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <style>{`
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
      }
      .animate-shake {
        animation: shake 0.4s cubic-bezier(0.36, 0, 0.66, -0.56);
      }
    `}
      <div
        className={cn(
          'inline-flex items-center gap-2.5 px-4 py-3 rounded-full',
          style.badgeColor,
          style.textColor,
          'font-semibold text-sm'
        )}
        role="status"
        aria-live="polite"
        aria-label={`${style.label}: ${style.description}`}
      >
        {getIcon()}
        <span>{style.label}</span>
      </div>
    </style>
  );
};

export default TransactionStatusBadge;
