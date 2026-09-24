import React from 'react';

interface SkeletonProps {
  /** Type of skeleton: card, line, circle, button, avatar, text-block */
  type?: 'card' | 'line' | 'circle' | 'button' | 'avatar' | 'text-block';
  /** Custom width */
  width?: string;
  /** Custom height */
  height?: string;
  /** Number of lines for text-block */
  lines?: number;
  /** Custom className */
  className?: string;
}

/**
 * Skeleton placeholder component for loading states.
 * Shows a shimmer animation while data is loading.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  type = 'line',
  width,
  height,
  lines = 3,
  className = '',
}) => {
  const getBaseClasses = (): string => {
    const base = 'bg-gray-200 rounded animate-pulse';
    switch (type) {
      case 'card':
        return `${base} w-full h-64`;
      case 'circle':
        return `${base} rounded-full w-12 h-12`;
      case 'button':
        return `${base} w-full h-12 rounded-full`;
      case 'avatar':
        return `${base} rounded-full w-10 h-10`;
      case 'line':
        return `${base} w-full h-4`;
      case 'text-block':
        return base;
      default:
        return base;
    }
  };

  if (type === 'text-block') {
    return (
      <div className={`space-y-2 ${className}`}>
        <style>{`
          @keyframes skeleton-shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .skeleton-shimmer {
            animation: skeleton-shimmer 2s infinite;
            background-size: 1000px 100%;
          }
        `}</style>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 h-4 rounded skeleton-shimmer ${
              i === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  const customStyle: React.CSSProperties = {};
  if (width) customStyle.width = width;
  if (height) customStyle.height = height;

  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-shimmer {
          animation: skeleton-shimmer 2s infinite;
          background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
          background-size: 1000px 100%;
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer {
            animation: none !important;
            background: #e5e7eb !important;
          }
        }
      `}</style>
      <div
        className={getBaseClasses()}
        style={customStyle}
      />
    </>
  );
};

/**
 * Skeleton card loader - shows a placeholder card while loading
 */
export const SkeletonCard: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-sm space-y-3">
    <Skeleton type="line" className="h-6" />
    <Skeleton type="text-block" lines={2} />
    <div className="flex gap-2 pt-2">
      <Skeleton type="button" width="60%" />
      <Skeleton type="button" width="40%" />
    </div>
  </div>
);

/**
 * Skeleton list loader - shows multiple placeholder rows
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} type="line" className="h-12" />
    ))}
  </div>
);

export default Skeleton;
