import React from 'react';

/**
 * Skeleton component that exactly matches the SeatSync EventCard layout.
 * Used during Firebase fetching to prevent "No events available" flicker
 * and maintain layout stability.
 */
export const EventCardSkeleton: React.FC = () => {
  return (
    <div
      className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-4 shadow-[0_12px_40px_rgba(0,100,200,0.08)] border border-white flex flex-col"
      style={{ fontFamily: '"DM Sans", sans-serif' }}
    >
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

      {/* Top Image Section Placeholder */}
      <div className="w-full h-[160px] rounded-[24px] overflow-hidden bg-gray-100 mb-4 skeleton-shimmer" />

      <div className="px-1 flex flex-col gap-3 flex-1">

        {/* Title, Location, and Action Button Row */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0 py-1">
            {/* Type badge placeholder */}
            <div className="w-16 h-5 rounded-full mb-2 skeleton-shimmer" />

            {/* Title placeholder */}
            <div className="w-3/4 h-5 rounded mb-2.5 skeleton-shimmer" />
            <div className="w-1/2 h-5 rounded mb-1 skeleton-shimmer" />

            {/* Location placeholder */}
            <div className="w-3/4 h-3.5 rounded mt-2.5 skeleton-shimmer" />
          </div>

          {/* Glassy Circular Arrow Button Placeholder */}
          <div className="w-10 h-10 rounded-full shrink-0 skeleton-shimmer" />
        </div>

        {/* Date & Seats Glassy Pill Bar Placeholder */}
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-3.5 py-2.5 rounded-2xl mt-auto border border-black/5">
          <div className="w-20 h-4 rounded skeleton-shimmer" />
          <div className="w-16 h-4 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default EventCardSkeleton;
