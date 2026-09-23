import React from 'react';
import { PremiumLoading } from './PremiumLoading';

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
}

/**
 * Full-screen loading state with premium animation.
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
      <PremiumLoading size="large" />
      {message && (
        <p className="mt-6 text-[#5E6C84] font-medium text-[15px] animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingScreen;
