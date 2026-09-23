import React from 'react';

interface PremiumLoadingProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Premium loading animation that matches the success animation design language.
 * Uses orbital rings with gradient and glow effects.
 * Respects prefers-reduced-motion.
 */
export const PremiumLoading: React.FC<PremiumLoadingProps> = ({
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const ringClasses = {
    small: 'w-7 h-7',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
  };

  const innerRingClasses = {
    small: 'w-5 h-5',
    medium: 'w-10 h-10',
    large: 'w-14 h-14',
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center ${className}`}>
      <style>{`
        @keyframes premium-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes premium-spin-reverse {
          to { transform: rotate(-360deg); }
        }
        @keyframes premium-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.15); }
        }
        .premium-spin {
          animation: premium-spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .premium-spin-reverse {
          animation: premium-spin-reverse 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .premium-pulse {
          animation: premium-pulse 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .premium-spin,
          .premium-spin-reverse,
          .premium-pulse {
            animation: none !important;
          }
        }
      `}</style>

      {/* Pulsing glow background */}
      <span
        className={`absolute ${ringClasses[size]} rounded-full bg-gradient-to-br from-[#3B9EFF]/30 to-[#007AFF]/20 premium-pulse`}
      />

      {/* Outer ring with gradient */}
      <span
        className={`absolute ${ringClasses[size]} rounded-full border-[3px] border-transparent bg-gradient-to-br from-[#3B9EFF] via-[#007AFF] to-[#3B9EFF] premium-spin`}
        style={{
          backgroundClip: 'padding-box',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      >
        <span className={`absolute inset-0 rounded-full border-[3px] border-[#3B9EFF]/20`} />
      </span>

      {/* Inner ring with opposite rotation */}
      <span
        className={`absolute ${innerRingClasses[size]} rounded-full border-[3px] border-transparent bg-gradient-to-tr from-[#007AFF] to-[#3B9EFF] premium-spin-reverse`}
        style={{
          backgroundClip: 'padding-box',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
    </div>
  );
};

export default PremiumLoading;
