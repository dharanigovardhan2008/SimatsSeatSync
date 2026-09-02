// Event Detail Page - Premium Apple Glassmorphism Design
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getEventById, registerForEvent } from '@/lib/firebase';
import { EventMap } from '@/components/events/EventMap';
import type { DocumentData } from 'firebase/firestore';
import { ArrowLeft, MapPin, Calendar, Clock, Info } from 'lucide-react';

export const EventDetail: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then((ev) => {
      setEvent(ev);
      setLoading(false);
    });
  }, [eventId]);

  const handleGetTicket = async () => {
    if (!userData || !eventId) return;
    setError('');
    setRegistering(true);
    try {
      const result = await registerForEvent(userData.id, eventId, userData.department);
      if (result.status === 'registered' && result.registrationId) {
        navigate(`/ticket/${result.registrationId}`);
      } else {
        setError('The event is full — you have been added to the waitlist.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not register for this event');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] flex items-center justify-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="w-10 h-10 rounded-full border-[3px] border-[#1D1D1F] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] flex items-center justify-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[36px] border border-white shadow-[0_16px_50px_rgba(0,100,200,0.06)] text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Info size={24} className="text-[#86868B]" />
          </div>
          <h2 className="text-[20px] font-extrabold text-[#1D1D1F] mb-2 tracking-tight">Event Unavailable</h2>
          <p className="text-[#5E6C84] font-medium text-[15px] mb-6">This event could not be found or has been removed.</p>
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-3.5 rounded-full bg-[#1D1D1F] text-white font-bold text-[15px] transition-all hover:bg-black active:scale-95 shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const heroImage = event.images?.[0];
  const isFull = event.available_seats <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] font-sans pb-36 flex flex-col items-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* Top Floating Nav Bar (Glassy) */}
      <div className="w-full max-w-4xl px-4 sm:px-6 pt-6 pb-4 flex justify-between items-center z-10 sticky top-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 bg-white/70 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(0,100,200,0.06)] border border-white/90 transition-transform active:scale-95 group"
        >
          <ArrowLeft size={20} className="text-[#1D1D1F] group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
        </button>
        
        <div className="bg-white/70 backdrop-blur-2xl px-6 py-2.5 rounded-full shadow-[0_8px_20px_rgba(0,100,200,0.06)] border border-white/90 text-[14px] font-bold text-[#1D1D1F] tracking-tight">
          Event Overview
        </div>

        <div className="w-11 h-11"></div> {/* Spacer for symmetry */}
      </div>

      {/* Main Content Constrained Container */}
      <div className="w-full max-w-4xl px-4 sm:px-6 flex flex-col gap-6">
        
        {/* Immersive Banner Hero (Apple Style) */}
        <div className="w-full h-[360px] md:h-[460px] rounded-[36px] relative overflow-hidden shadow-[0_20px_60px_rgba(0,100,200,0.1)] bg-gray-100 border border-white/60 group">
          {heroImage ? (
            <img 
              src={heroImage} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6C63FF] to-[#007AFF]"></div>
          )}
          
          {/* Top Overlays Container (Fixes Overlap) */}
          <div className="absolute top-5 left-5 right-5 flex justify-between items-start gap-4">
            
            {/* Location Pill Overlay */}
            {event.location?.address && (
              <div className="flex-1 min-w-0 max-w-fit bg-black/50 backdrop-blur-xl border border-white/10 text-white text-[13px] font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
                <MapPin size={16} strokeWidth={2.5} className="shrink-0 text-white/80" /> 
                <span className="truncate">{event.location.address}</span>
              </div>
            )}

            {/* Type/Mandatory Badges */}
            <div className="flex gap-2 shrink-0">
              {event.type && (
                <div className="bg-white/20 backdrop-blur-xl border border-white/20 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-lg">
                  {event.type}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Gradient Typography */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1F] via-[#1D1D1F]/30 to-transparent flex flex-col justify-end p-6 md:p-8 pt-20 pointer-events-none">
            <div className="flex flex-wrap items-center gap-2.5 text-white/95 text-[13px] font-bold mb-3">
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-sm">
                <Calendar size={15} /> {event.date}
              </span>
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-sm">
                <Clock size={15} /> {event.start_time}–{event.end_time}
              </span>
            </div>
            <h2 className="text-white text-[32px] md:text-[46px] font-extrabold tracking-tight leading-[1.1] drop-shadow-lg">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50/90 backdrop-blur-xl border border-red-100 text-red-600 rounded-[24px] p-5 text-[14px] font-bold shadow-[0_8px_30px_rgba(255,0,0,0.06)] flex items-start gap-3 transition-all">
            <Info className="shrink-0 mt-0.5" size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* About Card */}
        {event.about && (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,100,200,0.04)] border border-white transition-all hover:shadow-[0_16px_50px_rgba(0,100,200,0.08)]">
            <h3 className="text-[22px] font-extrabold text-[#1D1D1F] mb-3 tracking-tight">About</h3>
            <p className="text-[16px] text-[#5E6C84] leading-relaxed font-medium">
              {expanded || event.about.length <= 220 ? event.about : `${event.about.slice(0, 220)}...`}
              {event.about.length > 220 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[#1D1D1F] font-bold cursor-pointer ml-1.5 hover:underline transition-colors"
                >
                  {expanded ? 'Show less' : 'Read More'}
                </button>
              )}
            </p>
          </div>
        )}

        {/* Timeline Card */}
        {event.timeline?.length > 0 && (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,100,200,0.04)] border border-white transition-all hover:shadow-[0_16px_50px_rgba(0,100,200,0.08)]">
            <h3 className="text-[22px] font-extrabold text-[#1D1D1F] mb-5 tracking-tight">Timeline</h3>
            
            <div className="relative border-l-2 border-[#E5E7EB] ml-3 md:ml-4 space-y-6">
              {event.timeline.map((row: { time: string; title: string }, i: number) => (
                <div key={i} className="relative pl-6 md:pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute w-4 h-4 rounded-full bg-[#1D1D1F] border-[3px] border-white shadow-sm -left-[9px] top-1"></div>
                  
                  <div className="bg-[#F9F9FB] rounded-[24px] p-4 md:p-5 border border-black/5 hover:border-black/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[16px] text-[#1D1D1F] font-bold">{row.title}</span>
                    <span className="inline-flex w-fit text-[13px] text-[#6C63FF] font-extrabold bg-[#6C63FF]/10 px-4 py-2 rounded-full tracking-wide">
                      {row.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map Card */}
        {event.location?.lat && (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,100,200,0.04)] border border-white transition-all hover:shadow-[0_16px_50px_rgba(0,100,200,0.08)]">
            <h3 className="text-[22px] font-extrabold text-[#1D1D1F] mb-5 tracking-tight">Location</h3>
            <div className="rounded-[28px] overflow-hidden border border-black/5 shadow-inner">
              <EventMap lat={event.location.lat} lng={event.location.lng} label={event.title} />
            </div>
          </div>
        )}
      </div>

      {/* Premium Glassy Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-3xl border-t border-white shadow-[0_-10px_50px_rgba(0,100,200,0.08)] py-4 sm:py-5 px-6 z-30 pb-safe">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex flex-col">
            <p className="text-[11px] font-black text-[#86868B] uppercase tracking-wider mb-0.5">Starting From</p>
            <p className="text-[26px] font-black text-[#1D1D1F] leading-none tracking-tight">
              {event.registration_fee ? `₹${event.registration_fee}` : 'Free'}
            </p>
          </div>
          
          <button
            onClick={handleGetTicket}
            disabled={registering || isFull}
            className={`flex-1 max-w-[200px] sm:max-w-[240px] py-4 rounded-full text-[15px] font-extrabold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2
              ${isFull 
                ? 'bg-gray-200 text-[#86868B] shadow-none cursor-not-allowed' 
                : 'bg-[#1D1D1F] hover:bg-black text-white active:scale-95'
              }`}
          >
            {registering ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-[2.5px] border-white/30 border-t-white animate-spin" />
                Booking...
              </span>
            ) : isFull ? (
              'Event Full'
            ) : (
              'Get Ticket'
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default EventDetail;