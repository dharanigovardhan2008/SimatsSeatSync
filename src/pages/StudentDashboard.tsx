// Student Dashboard Page - Waitlist, Branch-specific features, and Block handling
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { 
  subscribeToEvents, 
  registerForEvent, 
  getUserRegistrations,
  cancelRegistration,
  subscribeToWaitlist,
  getUserDocument
} from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

interface EventData {
  id: string;
  title: string;
  type: 'Workshop' | 'Seminar'| 'Hackathon';
  date: string;
  start_time?: string;
  end_time?: string;
  total_seats: number;
  available_seats: number;
  status: 'Upcoming' | 'Closed';
  is_mandatory?: boolean;
  target_branches?: string[];
  images?: string[];
  location?: { address: string; lat: number; lng: number };
  registration_fee?: number;
}

const isEventHidden = (event: EventData): boolean => {
  if (!event.date) return false;
  const now = new Date();
  const buildDateTime = (dateStr: string, timeStr?: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes]   = timeStr ? timeStr.split(':').map(Number) : [23, 59];
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  };
  const startDT = buildDateTime(event.date, event.start_time);
  const endDT   = buildDateTime(event.date, event.end_time);
  if (now >= endDT) return true;
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (startDT <= twoHoursFromNow) return true;
  return false;
};

export const StudentDashboard: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [waitlistedEvents, setWaitlistedEvents] = useState<Map<string, number>>(new Map());
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);
  const [cancellingEvent, setCancellingEvent] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'blocked'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'bookings'>('events');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !userData)) {
      navigate('/login');
    } else if (!authLoading && userData && userData.role !== 'student') {
      navigate('/admin');
    }
  }, [user, userData, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const checkBlocked = async () => {
      const doc = await getUserDocument(user.uid);
      setIsBlocked(!!(doc as DocumentData)?.is_blocked);
    };
    checkBlocked();
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToEvents((eventsData: DocumentData[]) => {
      const filteredEvents = (eventsData as EventData[]).filter(event => {
        if (!['Workshop', 'Seminar', 'Hackathon'].includes(event.type)) return false;
        if (isEventHidden(event)) return false;
        if (!event.target_branches || event.target_branches.length === 0) return true;
        return event.target_branches.includes(userData?.department || '');
      });
      setEvents(filteredEvents);
    });
    return () => unsubscribe();
  }, [userData?.department]);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (user) {
        try {
          const regs = await getUserRegistrations(user.uid);
          setRegisteredEvents(new Set(regs.map((r: DocumentData) => r.event_id as string)));
        } catch (error) {
          console.error('Error fetching registrations:', error);
        }
      }
    };
    fetchRegistrations();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToWaitlist((waitlistData: DocumentData[]) => {
      const userWaitlist = new Map<string, number>();
      waitlistData.filter(w => w.user_id === user.uid).forEach(w => {
        userWaitlist.set(w.event_id, w.position);
      });
      setWaitlistedEvents(userWaitlist);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user || !userData) return;
    const freshDoc = await getUserDocument(user.uid) as DocumentData | null;
    if (freshDoc?.is_blocked) {
      setIsBlocked(true);
      setMessage({ type: 'blocked', text: 'Your account has been blocked by the admin. You cannot register for events at this time.' });
      return;
    }
    setLoadingEvent(eventId);
    setMessage(null);
    try {
      const result = await registerForEvent(user.uid, eventId, userData.department);
      if (result.status === 'registered') {
        setRegisteredEvents(prev => new Set([...prev, eventId]));
        setMessage({ type: 'success', text: result.message });
        if (result.registrationId) {
          navigate(`/ticket/${result.registrationId}`);
          return;
        }
      } else if (result.status === 'waitlisted') {
        setMessage({ type: 'info', text: result.message });
      }
      const regs = await getUserRegistrations(user.uid);
      setRegisteredEvents(new Set(regs.map((r: DocumentData) => r.event_id as string)));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      const isBlockError = errorMessage.toLowerCase().includes('blocked');
      setMessage({ type: isBlockError ? 'blocked' : 'error', text: errorMessage });
      if (isBlockError) setIsBlocked(true);
    } finally {
      setLoadingEvent(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    setCancellingEvent(eventId);
    setMessage(null);
    try {
      await cancelRegistration(user.uid, eventId);
      setRegisteredEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
      setMessage({ type: 'success', text: 'Registration cancelled successfully' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Cancellation failed';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setCancellingEvent(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h    = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EAF3FF] flex items-center justify-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#1D1D1F] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const upcomingEvents       = events.filter(e => e.status === 'Upcoming');
  const registeredEventsList = events.filter(e => registeredEvents.has(e.id));
  const waitlistedEventsList = events.filter(e => waitlistedEvents.has(e.id));
  const allMyEvents = [...registeredEventsList, ...waitlistedEventsList];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] text-[#1D1D1F] pb-24" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10 relative z-10">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="font-extrabold text-[28px] sm:text-[32px] text-[#1D1D1F] tracking-tight">
            Welcome, {userData?.name}! 👋
          </h1>
          <p className="mt-1 text-[#5E6C84] text-[14px] sm:text-[15px] font-medium">
            Browse and register for upcoming events
          </p>
        </div>

        {/* Blocked banner */}
        {isBlocked && (
          <div className="mb-6 p-5 rounded-[24px] bg-red-50/90 backdrop-blur-md border border-red-100 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-red-700 mb-1">Account Blocked</p>
                <p className="text-[14px] text-red-600 font-medium">
                  Your account has been blocked by the administrator. You can browse events but cannot register for any.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Messages */}
        {message && message.type !== 'blocked' && (
          <div className={`mb-6 p-4 rounded-[20px] font-semibold text-[14px] ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : message.type === 'info'    ? 'bg-blue-50 text-blue-700 border border-blue-100'
            : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            {message.text}
          </div>
        )}

        {/* Floating Glassy Pill Tabs */}
        <div className="flex justify-start mb-8 overflow-x-auto pb-2">
          <div className="flex p-1.5 bg-white/70 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white/90 shrink-0">
            {(['events', 'bookings'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#1D1D1F] text-white shadow-md'
                    : 'text-[#5E6C84] hover:text-[#1D1D1F]'
                }`}
              >
                {tab === 'events' ? 'Available Events' : `Bookings (${allMyEvents.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Available Events (World-Class Apple Glassy Event Cards) ── */}
        {activeTab === 'events' && (
          <div>
            <h2 className="font-extrabold text-[20px] text-[#1D1D1F] mb-6 tracking-tight">
              Available Events for {userData?.department}
            </h2>
            
            {upcomingEvents.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
                <p className="text-[#5E6C84] font-semibold text-[15px]">No events currently available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => {
                  const isRegistered    = registeredEvents.has(event.id);
                  const waitlistPosition = waitlistedEvents.get(event.id);
                  const isWaitlisted    = waitlistPosition !== undefined;
                  const isFull          = event.available_seats <= 0;

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
                            <span className="truncate">{event.location?.address || 'SIMATS Campus'}</span>
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

                        {/* Action Buttons with Premium Glassy Theme */}
                        <div className="mt-3 pt-1">
                          {isRegistered ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="w-full py-2.5 px-3 rounded-full bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 text-emerald-700 font-bold text-[13px] flex items-center justify-center shadow-sm">
                                Enrolled
                              </div>
                              <button 
                                onClick={() => handleCancel(event.id)} 
                                disabled={cancellingEvent === event.id}
                                className="w-full py-2.5 px-3 rounded-full bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-600 hover:bg-red-500/20 font-bold text-[13px] transition-all shadow-sm active:scale-95 flex items-center justify-center"
                              >
                                {cancellingEvent === event.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </div>
                          ) : isWaitlisted ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="w-full py-2.5 px-3 rounded-full bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 text-amber-700 font-bold text-[12px] flex items-center justify-center shadow-sm">
                                Waitlist #{waitlistPosition}
                              </div>
                              <button 
                                onClick={() => handleCancel(event.id)} 
                                disabled={cancellingEvent === event.id}
                                className="w-full py-2.5 px-3 rounded-full bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-600 hover:bg-red-500/20 font-bold text-[13px] transition-all shadow-sm active:scale-95 flex items-center justify-center"
                              >
                                {cancellingEvent === event.id ? 'Leaving...' : 'Leave'}
                              </button>
                            </div>
                          ) : isBlocked ? (
                            <div className="w-full py-3 rounded-full bg-gray-200/50 backdrop-blur-xl border border-gray-300/30 text-gray-400 font-bold text-[13px] text-center shadow-none">
                              Blocked
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRegister(event.id)}
                              disabled={loadingEvent === event.id}
                              className="w-full py-3 px-4 rounded-full bg-white/80 hover:bg-white backdrop-blur-2xl border border-white/90 text-[#1D1D1F] font-extrabold text-[14px] transition-all shadow-[0_8px_20px_rgba(0,100,200,0.1)] hover:shadow-[0_10px_25px_rgba(0,100,200,0.18)] active:scale-95 flex items-center justify-center gap-2 group/btn"
                            >
                              <span>{loadingEvent === event.id ? 'Enrolling...' : 'Enroll Now'}</span>
                              <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Bookings Tab (Redesigned with the exact same premium Apple event card style) ── */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="font-extrabold text-[20px] text-[#1D1D1F] mb-6 tracking-tight">
              My Bookings ({allMyEvents.length})
            </h2>

            {allMyEvents.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
                <p className="text-[#5E6C84] font-semibold text-[15px]">You have no active bookings yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allMyEvents.map((event) => {
                  const isWaitlisted = waitlistedEvents.has(event.id);
                  const position = waitlistedEvents.get(event.id);

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
                          <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold text-white shadow-sm ${isWaitlisted ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                            {isWaitlisted ? `Waitlist #${position}` : 'Confirmed'}
                          </span>
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
                            <span className="truncate">{event.location?.address || 'SIMATS Campus'}</span>
                          </div>
                          <span className="font-extrabold text-[#1D1D1F] shrink-0">
                            {event.registration_fee && event.registration_fee > 0 ? `₹${event.registration_fee}` : 'Free'}
                          </span>
                        </div>

                        {/* Date & Time Glassy Pill Bar */}
                        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-3.5 py-2.5 rounded-2xl mt-1 border border-white/50">
                          <div className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-[14px] h-[14px] text-[#5E6C84]">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[12px] font-bold text-[#1D1D1F]">
                              {formatDate(event.date)}
                            </span>
                          </div>
                          <span className="text-[12px] font-bold text-[#5E6C84]">
                            {formatTime(event.start_time)}
                          </span>
                        </div>

                        {/* Action Buttons with Premium Glassy Theme */}
                        <div className="mt-3 pt-1 grid grid-cols-2 gap-2">
                          <Link to={`/event/${event.id}`} className="w-full">
                            <button className="w-full py-2.5 px-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-2xl border border-white/90 text-[#1D1D1F] font-bold text-[13px] transition-all shadow-sm active:scale-95 flex items-center justify-center">
                              View Ticket
                            </button>
                          </Link>
                          <button
                            onClick={() => handleCancel(event.id)}
                            disabled={cancellingEvent === event.id}
                            className="w-full py-2.5 px-3 rounded-full bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-600 hover:bg-red-500/20 font-bold text-[13px] transition-all shadow-sm active:scale-95 flex items-center justify-center"
                          >
                            {cancellingEvent === event.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentDashboard;