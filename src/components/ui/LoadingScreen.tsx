import React from 'react';

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
  subMessage?: string;
}

/**
 * SeatSync Loading Modal.
 * Uses the exact ticket-confirmation loading animation with a centered card modal,
 * dark translucent overlay, and heavy background blur.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  fullScreen = true,
  message = 'Confirming your seat',
  subMessage = 'Just a moment…'
}) => {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-md es-fade ${
        !fullScreen ? 'relative !min-h-[300px] !bg-transparent !backdrop-blur-none' : ''
      }`}
    >
      <style>{`
        @keyframes es-fade { from { opacity:0 } to { opacity:1 } }
        .es-fade { animation: es-fade .25s ease-out both }

        @keyframes es-card {
          0%   { transform: scale(.85) translateY(8px); opacity:0 }
          100% { transform: scale(1) translateY(0); opacity:1 }
        }
        .es-card { animation: es-card .35s cubic-bezier(.2,.9,.3,1.1) both }

        @keyframes es-spin { to { transform: rotate(360deg) } }
        .es-spin  { animation: es-spin 1s linear infinite }
        .es-spin-r{ animation: es-spin 1.5s linear infinite reverse }

        @keyframes es-breathe {
          0%,100% { transform: scale(1); opacity:.55 }
          50%     { transform: scale(1.12); opacity:.25 }
        }
        .es-breathe { animation: es-breathe 1.6s ease-in-out infinite }

        @media (prefers-reduced-motion: reduce) {
          .es-card,.es-fade,.es-spin,.es-spin-r,.es-breathe {
            animation: none !important; opacity: 1 !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-[32px] px-8 py-9 shadow-[0_20px_50px_rgba(0,0,0,0.18)] flex flex-col items-center max-w-[320px] w-full mx-4 es-card border border-white/80">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          {/* Subtle breathing glow */}
          <span className="absolute w-20 h-20 rounded-full bg-[#3B9EFF]/20 es-breathe" />

          {/* Very light blue circular track + animated sky blue outer arc */}
          <span className="absolute w-20 h-20 rounded-full border-[3px] border-[#3B9EFF]/20 border-t-[#3B9EFF] es-spin" />

          {/* Deep blue reverse-orbiting inner arc */}
          <span className="absolute w-14 h-14 rounded-full border-[3px] border-transparent border-b-[#007AFF] es-spin-r" />
        </div>

        <h3 className="text-[19px] font-extrabold text-[#1D1D1F] tracking-tight text-center">
          {message}
        </h3>
        <p className="text-[14px] text-[#5E6C84] font-medium mt-1.5 text-center">
          {subMessage}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
