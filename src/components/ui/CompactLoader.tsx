import React from 'react';
import { PremiumLoading } from './PremiumLoading';

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
 * Compact, lightweight loader for buttons, forms, and inline operations.
 * Uses minimal animation for better performance.
 * Respects prefers-reduced-motion.
 */
export const CompactLoader: React.FC<CompactLoaderProps> = ({
  size = 'md',
  inline = false,
  className = '',
  label,
}) => {
  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const borderClasses = {
    xs: 'border border-current',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-2',
  };

  const containerClass = inline ? 'inline-flex items-center gap-2' : 'flex items-center gap-2';

  return (
    <div className={`${containerClass} ${className}`}>
      <style>{`
        @keyframes compact-spin {
          to { transform: rotate(360deg); }
        }
        .compact-spin {
          animation: compact-spin 0.8s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .compact-spin {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className={`${sizeClasses[size]} ${borderClasses[size]} rounded-full border-current border-t-transparent compact-spin shrink-0`}
      />

      {label && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </div>
  );
};

export default CompactLoader;
