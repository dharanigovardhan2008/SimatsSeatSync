import React from 'react';

interface CompactLoaderProps {
  /** Size of the loader: xs (4px dot), sm (inline), md (button), lg (card) */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Display inline with text or as standalone */
  inline?: boolean;
  /** Custom className */
  className?: string;
  /** Optional loading text */
  label?: string;
}

/**
 * Compact inline loader matching SeatSync's premium enrolling animation.
 * Reuses the exact animation from EnrollStatusOverlay for consistency.
 * Respects prefers-reduced-motion.
 */
export const CompactLoader: React.FC<CompactLoaderProps> = ({
  size = 'md',
  inline = false,
  className = '',
  label,
}) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const ringClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4.5 h-4.5',
  };

  const containerClass = inline ? 'inline-flex items-center gap-2' : 'flex items-center gap-2';

  return (
    <div className={`${containerClass} ${className}`}>
      <style>{`
        @keyframes es-spin { to { transform: rotate(360deg) } }
        .es-spin  { animation: es-spin 1s linear infinite }
        .es-spin-r{ animation: es-spin 1.5s linear infinite reverse }

        @keyframes es-breathe {
          0%,100% { transform: scale(1); opacity:.55 }
          50%     { transform: scale(1.12); opacity:.25 }
        }
        .es-breathe { animation: es-breathe 1.6s ease-in-out infinite }

        @media (prefers-reduced-motion: reduce) {
          .es-spin,.es-spin-r,.es-breathe {
            animation: none !important;
          }
        }
      `}</style>

      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Pulsing glow background */}
        <span
          className={`absolute ${ringClasses[size]} rounded-full bg-[#3B9EFF]/25 es-breathe`}
        />

        {/* Outer ring with gradient */}
        <span
          className={`absolute ${ringClasses[size]} rounded-full border-[1.5px] border-transparent bg-gradient-to-br from-[#3B9EFF] to-[#007AFF] es-spin`}
          style={{
            backgroundClip: 'padding-box',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Inner ring with opposite rotation */}
        <span
          className={`absolute w-1 h-1 rounded-full border-[1.5px] border-transparent bg-gradient-to-tr from-[#007AFF] to-[#3B9EFF] es-spin-r`}
          style={{
            backgroundClip: 'padding-box',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      </div>

      {label && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </div>
  );
};

export default CompactLoader;
