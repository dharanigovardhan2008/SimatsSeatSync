import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Phone } from 'lucide-react';

interface FailureModalProps {
  error: string;
  onRetry: () => void;
  onDifferentMethod: () => void;
}

/**
 * FailureModal — Handle payment failures gracefully
 *
 * Features:
 * - Specific error message from Razorpay (not generic)
 * - "Try Again" button to retry with same method
 * - "Try Different Method" option
 * - "Contact Support" link
 */
export const FailureModal: React.FC<FailureModalProps> = ({
  error,
  onRetry,
  onDifferentMethod,
}) => {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <style>{`
        @keyframes failure-scale {
          0% { transform: scale(0.85) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .failure-scale { animation: failure-scale 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .shake-animate {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0" />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl px-8 py-10 shadow-2xl flex flex-col items-center max-w-sm mx-4 failure-scale">
        {/* Error Icon with Shake */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-[#FF3B30]/10 flex items-center justify-center shake-animate">
            <AlertCircle className="w-12 h-12 text-[#FF3B30]" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[#1D1D1F] text-center">
          Payment Failed
        </h2>
        <p className="text-sm text-[#5E6C84] text-center mt-2">
          We couldn't process your payment
        </p>

        {/* Error Message */}
        <div className="w-full my-6 p-4 rounded-2xl bg-[#FF3B30]/5 border border-[#FF3B30]/10">
          <p className="text-xs font-bold text-[#FF3B30] uppercase tracking-wide mb-2">
            Error
          </p>
          <p className="text-sm text-[#1D1D1F]">{error}</p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {/* Retry Button - Primary */}
          <button
            onClick={onRetry}
            className="w-full px-6 py-3 rounded-full bg-[#3B9EFF] text-white font-semibold hover:bg-[#007AFF] transition-colors active:scale-95"
          >
            Try Again
          </button>

          {/* Different Method - Secondary */}
          <button
            onClick={onDifferentMethod}
            className="w-full px-6 py-3 rounded-full bg-[#F9F9FB] text-[#1D1D1F] font-semibold border border-black/10 hover:bg-black/5 transition-colors active:scale-95"
          >
            Try Different Method
          </button>
        </div>

        {/* Support Link */}
        <button
          onClick={() => {
            const subject = encodeURIComponent('Payment Failed - Support Needed');
            const body = encodeURIComponent(`Hi,\n\nI encountered an error while trying to make a payment:\n\n"${error}"\n\nPlease help me resolve this.\n\nThank you.`);
            window.location.href = `mailto:support@seatsync.app?subject=${subject}&body=${body}`;
          }}
          className="w-full mt-4 px-6 py-3 rounded-full bg-transparent border border-[#FF3B30]/30 text-[#FF3B30] font-semibold hover:bg-[#FF3B30]/5 transition-colors flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4" />
          Contact Support
        </button>
      </div>
    </div>,
    document.body
  );
};

export default FailureModal;
