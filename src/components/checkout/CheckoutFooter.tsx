import React from 'react';
import { Lock } from 'lucide-react';
import { CompactLoader } from '@/components/ui/CompactLoader';

interface CheckoutFooterProps {
  amount: number;
  selectedMethod: string | null;
  isProcessing: boolean;
  isDisabled: boolean;
  onSubmit: () => void;
}

/**
 * CheckoutFooter — Sticky "Pay ₹XXX" button
 *
 * Desktop: Bottom-right corner
 * Mobile: Full-width at bottom
 *
 * Features:
 * - Dynamic amount display
 * - Disabled until method selected
 * - Loading spinner during processing
 * - Lock icon + "Secured by Razorpay" badge
 */
export const CheckoutFooter: React.FC<CheckoutFooterProps> = ({
  amount,
  selectedMethod,
  isProcessing,
  isDisabled,
  onSubmit,
}) => {
  return (
    <>
      {/* Spacer for fixed footer on mobile */}
      <div className="md:hidden h-24" />

      {/* Footer Container */}
      <div className="fixed bottom-0 left-0 right-0 md:fixed md:bottom-6 md:right-6 md:w-auto bg-white md:bg-transparent md:backdrop-blur-0 border-t md:border-0 border-black/10 p-4 md:p-0 md:rounded-2xl md:shadow-lg md:backdrop-blur-xl">
        <div className="max-w-7xl mx-auto md:mx-0 space-y-3">
          {/* Security Badge */}
          <div className="hidden md:flex items-center justify-center gap-1 text-xs text-[#5E6C84]">
            <Lock className="w-3.5 h-3.5 text-[#34C759]" />
            <span>Secured by Razorpay</span>
          </div>

          {/* Pay Button */}
          <button
            onClick={onSubmit}
            disabled={isDisabled}
            className={`w-full md:w-auto px-8 py-3.5 rounded-full font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#3B9EFF] to-[#007AFF] text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
            aria-label={`Pay ${amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : ''} with Razorpay`}
          >
            {isProcessing ? (
              <>
                <CompactLoader size="sm" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Pay</span>
                <span className="font-extrabold">
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </>
            )}
          </button>

          {/* Mobile Security Badge */}
          <div className="md:hidden flex items-center justify-center gap-1 text-xs text-[#5E6C84]">
            <Lock className="w-3.5 h-3.5 text-[#34C759]" />
            <span>Secured by Razorpay</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutFooter;
