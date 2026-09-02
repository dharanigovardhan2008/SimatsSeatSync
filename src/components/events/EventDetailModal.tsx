// Event Detail Page - Apple Glassmorphism & Minimalist Design
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { getEventDocument, registerForEvent, getUserRegistrations, cancelRegistration, subscribeToWaitlist, getUserDocument } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'speakers'>('overview');
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'blocked'; text: string } | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Hackathon team state
  const [teamData, setTeamData] = useState({ teamName: '', members: [''] });

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const docData = await getEventDocument(id);
        if (docData) {
          setEvent(docData);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const checkUserStatus = async () => {
      const doc = await getUserDocument(user.uid);
      setIsBlocked(!!(doc as DocumentData)?.is_blocked);
      
      const regs = await getUserRegistrations(user.uid);
      const found = regs.some((r: DocumentData) => r.event_id === id);
      setIsRegistered(found);
    };
    checkUserStatus();
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) return;
    const unsubscribe = subscribeToWaitlist((waitlistData: DocumentData[]) => {
      const entry = waitlistData.find(w => w.user_id === user.uid && w.event_id === id);
      if (entry) {
        setWaitlistPosition(entry.position);
      } else {
        setWaitlistPosition(null);
      }
    });
    return () => unsubscribe();
  }, [user, id]);

  const handleRegister = async () => {
    if (!user || !userData || !id) {
      navigate('/login');
      return;
    }
    const freshDoc = await getUserDocument(user.uid) as DocumentData | null;
    if (freshDoc?.is_blocked) {
      setIsBlocked(true);
      setMessage({ type: 'blocked', text: 'Your account has been blocked by the admin.' });
      return;
    }
    setLoadingAction(true);
    setMessage(null);
    try {
      const result = await registerForEvent(user.uid, id, userData.department);
      if (result.status === 'registered') {
        setIsRegistered(true);
        setMessage({ type: 'success', text: result.message });
      } else if (result.status === 'waitlisted') {
        setMessage({ type: 'info', text: result.message });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Registration failed';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancel = async () => {
    if (!user || !id) return;
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    setLoadingAction(true);
    setMessage(null);
    try {
      await cancelRegistration(user.uid, id);
      setIsRegistered(false);
      setWaitlistPosition(null);
      setMessage({ type: 'success', text: 'Registration cancelled successfully.' });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Cancellation failed';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoadingAction(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#EAF3FF] flex items-center justify-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#1D1D1F] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#EAF3FF] text-[#1D1D1F]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <Navbar />
        <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-extrabold mb-4">Event Not Found</h2>
          <Link to="/" className="px-6 py-3 rounded-full bg-[#1D1D1F] text-white font-bold text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isFull = event.available_seats <= 0;
  const mainImage = event.images?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] text-[#1D1D1F] pb-24" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 relative z-10">
        
        {/* Back Button & Tab Bar Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-white/90 flex items-center justify-center text-[#1D1D1F] shadow-sm hover:bg-white transition-all"
          >
            ←
          </button>
          
          <div className="flex p-1 bg-white/70 backdrop-blur-2xl rounded-full border border-white/90 shadow-sm">
            {(['overview', 'schedule', 'speakers'] as const).map(tab => {
              if (tab === 'schedule' && (!event.schedule || event.schedule.length === 0)) return null;
              if (tab === 'speakers' && (!event.speakers || event.speakers.length === 0)) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full text-[13px] font-bold capitalize transition-all ${
                    activeTab === tab ? 'bg-[#1D1D1F] text-white shadow-sm' : 'text-[#5E6C84] hover:text-[#1D1D1F]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-[20px] font-semibold text-[14px] ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100'
            : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            {message.text}
          </div>
        )}

        {/* Hero Banner Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-4 sm:p-6 shadow-[0_16px_50px_rgba(0,100,200,0.08)] border border-white mb-6">
          {mainImage ? (
            <div className="relative w-full h-[280px] sm:h-[380px] rounded-[28px] overflow-hidden mb-6 bg-gray-100 shadow-inner">
              <img src={mainImage} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-white/20 backdrop-blur-md text-white border border-white/30">
                  {event.type?.toUpperCase() || 'EVENT'}
                </span>
                {event.is_mandatory && (
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-red-500 text-white shadow-sm">
                    Mandatory
                  </span>
                )}
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {event.title}
                </h1>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-8 text-center bg-gray-50 rounded-[28px] border border-gray-100">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1D1D1F] mb-2">{event.title}</h1>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
            <div className="bg-white/70 backdrop-blur-md p-4 rounded-[24px] border border-white/90 shadow-sm">
              <div className="text-xl mb-1">📅</div>
              <div className="text-[11px] text-[#5E6C84] uppercase font-bold">Date</div>
              <div className="text-[14px] font-extrabold text-[#1D1D1F]">{formatDate(event.date)}</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md p-4 rounded-[24px] border border-white/90 shadow-sm">
              <div className="text-xl mb-1">⏰</div>
              <div className="text-[11px] text-[#5E6C84] uppercase font-bold">Time</div>
              <div className="text-[14px] font-extrabold text-[#1D1D1F]">{event.start_time || '10:00 AM'}</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md p-4 rounded-[24px] border border-white/90 shadow-sm">
              <div className="text-xl mb-1">📍</div>
              <div className="text-[11px] text-[#5E6C84] uppercase font-bold">Venue</div>
              <div className="text-[14px] font-extrabold text-[#1D1D1F] truncate">{event.location?.address || 'Campus'}</div>
            </div>
            <div className="bg-white/70 backdrop-blur-md p-4 rounded-[24px] border border-white/90 shadow-sm">
              <div className="text-xl mb-1">🪑</div>
              <div className="text-[11px] text-[#5E6C84] uppercase font-bold">Seats Left</div>
              <div className={`text-[14px] font-extrabold ${isFull ? 'text-red-500' : 'text-[#38B2AC]'}`}>
                {isFull ? 'Full' : `${event.available_seats ?? 50} / ${event.total_seats ?? 100}`}
              </div>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="pt-2">
            {activeTab === 'overview' && (
              <div className="space-y-4 text-[#1D1D1F]">
                <h3 className="text-lg font-extrabold tracking-tight">About This Event</h3>
                <p className="text-[#5E6C84] text-[15px] leading-relaxed font-medium whitespace-pre-line">
                  {event.long_description || event.description || 'No description provided.'}
                </p>
              </div>
            )}
            {activeTab === 'schedule' && event.schedule && (
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold tracking-tight mb-4">Event Schedule</h3>
                {event.schedule.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-[20px] bg-white/60 backdrop-blur-md border border-white/80 flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#5E6C84] mb-0.5">{item.time}</div>
                      <h4 className="font-extrabold text-[15px] text-[#1D1D1F]">{item.title}</h4>
                      <p className="text-xs text-[#5E6C84] font-medium mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'speakers' && event.speakers && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.speakers.map((speaker: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-[24px] bg-white/60 backdrop-blur-md border border-white/80 flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {speaker.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[16px] text-[#1D1D1F]">{speaker.name}</h4>
                      <p className="text-xs text-[#6C63FF] font-bold">{speaker.title}</p>
                      <p className="text-xs text-[#5E6C84] font-medium mt-1 line-clamp-2">{speaker.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-5 shadow-[0_16px_50px_rgba(0,100,200,0.08)] border border-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-bold text-[#5E6C84] uppercase tracking-wider">Registration Fee</div>
            <div className="text-[22px] font-extrabold text-[#1D1D1F]">
              {event.registration_fee && event.registration_fee > 0 ? `₹${event.registration_fee}` : 'Free'}
            </div>
          </div>

          <div className="w-full sm:w-auto flex gap-3">
            {isRegistered ? (
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial px-6 py-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-extrabold text-[14px] flex items-center justify-center">
                  ✓ Enrolled
                </div>
                <button
                  onClick={handleCancel}
                  disabled={loadingAction}
                  className="px-6 py-3.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20 font-extrabold text-[14px] transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : waitlistPosition !== null ? (
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial px-6 py-3.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 font-extrabold text-[14px] flex items-center justify-center">
                  Waitlist #{waitlistPosition}
                </div>
                <button
                  onClick={handleCancel}
                  disabled={loadingAction}
                  className="px-6 py-3.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20 font-extrabold text-[14px] transition-all"
                >
                  Leave
                </button>
              </div>
            ) : isBlocked ? (
              <div className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gray-200 text-gray-500 font-extrabold text-[14px] text-center">
                Account Blocked
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loadingAction}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-[14px] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{loadingAction ? 'Processing...' : isFull ? 'Join Waitlist' : 'Register Now'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default EventDetail;