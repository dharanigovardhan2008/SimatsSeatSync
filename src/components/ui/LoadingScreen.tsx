import React from 'react';
import { PremiumLoading } from './PremiumLoading';

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
}

/**
 * Full-screen loading state using SeatSync's enrolling animation.
 * Reuses the exact animation from EnrollStatusOverlay for consistency.
 * Used during auth checks and route transitions.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  fullScreen = true,
  message
}) => {
  const containerClass = fullScreen
    ? "min-h-screen bg-transparent flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center py-20";

  return (
    <div className={containerClass}>
      <style>{`
        @keyframes fade-in-text {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        .text-fade { animation: fade-in-text 0.6s ease-out 0.3s both }

        @media (prefers-reduced-motion: reduce) {
          .text-fade { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      <PremiumLoading size="large" />
      {message && (
        <p className="mt-6 text-[#5E6C84] font-medium text-[15px] text-fade">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingScreen;
