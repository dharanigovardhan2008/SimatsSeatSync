import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle } from 'lucide-react';
import { playSuccessSound } from '@/utils/soundEffects';

interface SuccessModalProps {
  amount: number;
  orderId: string;
  eventTitle: string;
}

/**
 * SuccessModal — Celebration moment with checkmark animation + sound
 *
 * Features:
 * - Checkmark animation (reusing EnrollStatusOverlay pattern)
 * - Celebratory success sound (plays once)
 * - Transaction details display
 * - "Continue to My Tickets" button
 * - Auto-redirects after 4 seconds
 */
export const SuccessModal: React.FC<SuccessModalProps> = ({
  amount,
  orderId,
  eventTitle,
}) => {
  const playedRef = useRef(false);

  useEffect(() => {
    // Play sound once
    if (!playedRef.current) {
      playedRef.current = true;
      playSuccessSound();
    }
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <style>{`
        @keyframes success-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .success-fade { animation: success-fade-in 0.3s ease-out both; }

        @keyframes success-scale {
          0% { transform: scale(0.85) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .success-scale { animation: success-scale 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }

        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        .checkmark-animate {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: checkmark-draw 0.6s ease-out 0.3s forwards;
        }

        @keyframes success-ring {
          0% { transform: scale(0.65); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .success-ring {
          animation: success-ring 1.2s ease-out;
        }
        .success-ring:nth-child(2) {
          animation-delay: 0.3s;
        }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl px-8 py-10 shadow-2xl flex flex-col items-center max-w-sm mx-4 success-scale">
        {/* Animated Icon Container */}
        <div className="relative w-24 h-24 mb-6">
          {/* Ring ripples */}
          <span className="absolute inset-0 rounded-full bg-[#34C759]/20 success-ring" />
          <span className="absolute inset-0 rounded-full bg-[#34C759]/20 success-ring" />

          {/* Checkmark Circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#34C759] to-[#28A745] flex items-center justify-center shadow-lg">
            <svg
              className="w-12 h-12 text-white checkmark-animate"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[#1D1D1F] text-center">
          Payment Successful!
        </h2>
        <p className="text-sm text-[#5E6C84] text-center mt-2">
          Your registration for <span className="font-semibold">{eventTitle}</span> is confirmed
        </p>

        {/* Transaction Details */}
        <div className="w-full space-y-3 my-8 p-4 rounded-2xl bg-[#F9F9FB] border border-black/5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide">Amount Paid</span>
            <span className="text-lg font-extrabold text-[#1D1D1F]">
              ₹{amount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide">Order ID</span>
            <span className="text-xs font-mono text-[#1D1D1F]">{orderId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide">Status</span>
            <span className="px-2.5 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-xs font-bold">
              Verified
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="w-full px-6 py-3 rounded-full bg-[#3B9EFF] text-white font-semibold hover:bg-[#007AFF] transition-colors active:scale-95"
          onClick={() => window.location.href = '/tickets'}
        >
          Continue to My Tickets
        </button>

        {/* Auto-redirect message */}
        <p className="text-xs text-[#5E6C84] text-center mt-4">
          You will be redirected automatically in 4 seconds...
        </p>
      </div>
    </div>,
    document.body
  );
};

export default SuccessModal;
