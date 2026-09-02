// Home Page Component - Apple Glassmorphism & Minimalist Design
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { subscribeToEvents } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

interface EventData {
  id: string;
  title: string;
  type: 'Workshop' | 'Seminar' | 'Hackathon';
  date: string;
  start_time?: string;
  end_time?: string;
  total_seats: number;
  available_seats: number;
  status: 'Upcoming' | 'Closed';
  is_mandatory?: boolean;
  images?: string[];
  location?: { address: string; lat: number; lng: number };
  registration_fee?: number;
}

export const Home: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToEvents((eventsData: DocumentData[]) => {
      const validEvents = (eventsData as EventData[]).filter(
        (event) => event.status === 'Upcoming'
      );
      setEvents(validEvents);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] text-[#1D1D1F] pb-24" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/90 shadow-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-[#38B2AC] animate-pulse"></span>
          <span className="text-[12px] font-extrabold text-[#1D1D1F] uppercase tracking-wider">Official Portal</span>
        </div>
        
        <h1 className="font-extrabold text-[40px] sm:text-[56px] text-[#1D1D1F] tracking-tight leading-[1.1] mb-6">
          Discover & Book <br />
          <span className="bg-gradient-to-r from-[#6C63FF] to-[#007AFF] bg-clip-text text-transparent">
            Academic Workshops & Events
          </span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-[#5E6C84] text-[16px] sm:text-[18px] font-medium leading-relaxed mb-10">
          Seamlessly sync your schedule, secure your workshop seats instantly, and manage your academic journey with Apple-style minimalism.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link 
            to="/register" 
            className="px-8 py-4 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-[15px] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] active:scale-95"
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="px-8 py-4 rounded-full bg-white/80 hover:bg-white backdrop-blur-xl border border-white/90 text-[#1D1D1F] font-extrabold text-[15px] transition-all shadow-sm active:scale-95"
          >
            Student Login
          </Link>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-extrabold text-[24px] sm:text-[28px] text-[#1D1D1F] tracking-tight">Featured Events</h2>
            <p className="text-[14px] text-[#5E6C84] font-medium mt-0.5">Explore active workshops, seminars, and hackathons</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#1D1D1F] border-t-transparent animate-spin"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
            <p className="text-[#5E6C84] font-semibold text-[15px]">No active events right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const isFull = event.available_seats <= 0;

              return (
                <div key={event.id} className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-4 shadow-[0_12px_40px_rgba(0,100,200,0.08)] hover:shadow-[0_18px_50px_rgba(0,100,200,0.12)] transition-all border border-white flex flex-col group">
                  
                  {/* Top Image Section */}
                  {event.images?.[0] ? (
                    <div className="w-full h-[160px] rounded-[24px] overflow-hidden relative mb-4 bg-gray-100">
                      <img 
                        src={event.images[0]} 
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

                  <div className="px-1 flex flex-col gap-3 flex-1">
                    
                    {/* Title & Arrow Button Row */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#6C63FF]/10 text-[#6C63FF] mb-1.5">
                          {event.type}
                        </span>
                        <Link to={`/event/${event.id}`}>
                          <h3 className="font-bold text-[18px] text-[#1D1D1F] leading-tight tracking-tight hover:underline line-clamp-1">
                            {event.title}
                          </h3>
                        </Link>
                      </div>

                      {/* Glassy Arrow Button */}
                      <Link to={`/event/${event.id}`} className="w-10 h-10 bg-[#1D1D1F]/90 backdrop-blur-md rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 active:scale-95">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      </Link>
                    </div>

                    {/* Location & Fee */}
                    <div className="flex items-center justify-between text-[13px] text-[#5E6C84] font-medium">
                      <div className="flex items-center gap-1.5 truncate">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-[14px] h-[14px] shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="truncate">{event.location?.address || 'Campus'}</span>
                      </div>
                      <span className="font-extrabold text-[#1D1D1F] shrink-0">
                        {event.registration_fee && event.registration_fee > 0 ? `₹${event.registration_fee}` : 'Free'}
                      </span>
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
                        {isFull ? 'Full' : `${event.available_seats} seats left`}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="mt-3 pt-1">
                      <Link to={`/event/${event.id}`}>
                        <button className="w-full py-3 px-4 rounded-full bg-white/80 hover:bg-white backdrop-blur-2xl border border-white/90 text-[#1D1D1F] font-extrabold text-[14px] transition-all shadow-[0_8px_20px_rgba(0,100,200,0.1)] hover:shadow-[0_10px_25px_rgba(0,100,200,0.18)] active:scale-95 flex items-center justify-center gap-2 group/btn">
                          <span>View Details & Register</span>
                          <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;