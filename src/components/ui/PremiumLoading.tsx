import React from 'react';

interface PremiumLoadingProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Premium loading animation matching SeatSync's enrolling state.
 * Reuses the exact animation from EnrollStatusOverlay for consistency.
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
        @keyframes es-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes es-spin-r {
          to { transform: rotate(-360deg); }
        }
        @keyframes es-breathe {
          0%,100% { transform: scale(1); opacity:.55 }
          50%     { transform: scale(1.12); opacity:.25 }
        }
        .es-spin {
          animation: es-spin 1s linear infinite;
        }
        .es-spin-r {
          animation: es-spin-r 1.5s linear infinite;
        }
        .es-breathe {
          animation: es-breathe 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .es-spin,
          .es-spin-r,
          .es-breathe {
            animation: none !important;
          }
        }
      `}</style>

      {/* Pulsing glow background */}
      <span
        className={`absolute ${ringClasses[size]} rounded-full bg-[#3B9EFF]/25 es-breathe`}
      />

      {/* Outer ring with gradient */}
      <span
        className={`absolute ${ringClasses[size]} rounded-full border-[3px] border-transparent bg-gradient-to-br from-[#3B9EFF] via-[#007AFF] to-[#3B9EFF] es-spin`}
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
        className={`absolute ${innerRingClasses[size]} rounded-full border-[3px] border-transparent bg-gradient-to-tr from-[#007AFF] to-[#3B9EFF] es-spin-r`}
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
