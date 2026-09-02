// Event Card Component - Apple Glassmorphism & Minimalist Design Style
import React from 'react';
import { Link } from 'react-router-dom';
import type { DocumentData } from 'firebase/firestore';

interface EventCardProps {
  event: DocumentData;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const image = event.images?.[0];
  const isFull = event.available_seats !== undefined && event.available_seats <= 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sep 05';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <Link
      to={`/event/${event.id}`}
      className="block bg-white/80 backdrop-blur-2xl rounded-[32px] p-4 shadow-[0_12px_40px_rgba(0,100,200,0.08)] hover:shadow-[0_18px_50px_rgba(0,100,200,0.12)] transition-all border border-white group"
      style={{ fontFamily: '"DM Sans", sans-serif' }}
    >
      {/* Top Image Section */}
      {image ? (
        <div className="relative w-full h-[160px] rounded-[24px] overflow-hidden bg-gray-100 mb-4">
          <img 
            src={image} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          {event.is_mandatory && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-500 text-white shadow-sm">
              Mandatory
            </span>
          )}
        </div>
      ) : (
        <div className="w-full h-[160px] bg-white/50 rounded-[24px] flex items-center justify-center text-[#5E6C84] font-bold text-[13px] mb-4 border border-white">
          No Image Available
        </div>
      )}

      <div className="px-1 flex flex-col gap-3">
        
        {/* Title, Location, and Action Button Row */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            {event.type && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#6C63FF]/10 text-[#6C63FF] mb-1.5 uppercase">
                {event.type}
              </span>
            )}
            <h3 className="font-bold text-[18px] text-[#1D1D1F] leading-tight truncate tracking-tight">
              {event.title}
            </h3>
            
            {/* Location */}
            <div className="flex items-center gap-1.5 mt-1.5 text-[#5E6C84]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-[14px] h-[14px] shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-[13px] font-medium truncate">
                {event.location?.address || 'Campus'}
              </span>
            </div>
          </div>

          {/* Glassy Circular Arrow Button */}
          <div className="w-10 h-10 bg-[#1D1D1F]/90 backdrop-blur-md rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105 active:scale-90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </div>
        </div>

        {/* Date & Seats Glassy Pill Bar */}
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-3.5 py-2.5 rounded-2xl mt-1 border border-white/50">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-[14px] h-[14px] text-[#5E6C84]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[12px] font-bold text-[#1D1D1F]">
              {formatDate(event.date)}
            </span>
          </div>
          <span className={`text-[12px] font-bold ${isFull ? 'text-red-500' : 'text-[#38B2AC]'}`}>
            {isFull ? 'Full' : event.available_seats !== undefined ? `${event.available_seats} seats left` : (event.registration_fee ? `₹${event.registration_fee}` : 'Free')}
          </span>
        </div>

      </div>
    </Link>
  );
};

export default EventCard;