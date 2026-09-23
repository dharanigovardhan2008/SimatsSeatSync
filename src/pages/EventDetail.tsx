// Event Detail Page - Premium Apple Glassmorphism Design
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getEventById, registerForEvent, registerTeamForEvent, isRegistrationClosed, logRegistrationToSheet, createNotification, getTeamByCode, getUserRegistrations, cancelRegistration, type PaymentProof } from '@/lib/firebase';
import { notifyPaymentSubmittedAPI, notifyTeamRegisteredAPI } from '@/lib/notificationApi';
import { PaymentModal } from '@/components/events/PaymentModal';
import { EventMap } from '@/components/events/EventMap';
import { TeamEnrollModal } from '@/components/events/TeamEnrollModal';
import { TeamChoiceModal } from '@/components/events/TeamChoiceModal';
import { EnrollStatusOverlay } from '@/components/ui/EnrollStatusOverlay';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CompactLoader } from '@/components/ui/CompactLoader';
import type { DocumentData } from 'firebase/firestore';
import { ArrowLeft, MapPin, Calendar, Clock, Info, Navigation, User, Phone, Check, X, AlertCircle } from 'lucide-react';

// Builds a URL to open for "Locate" — prefers an explicit Maps link,
// otherwise falls back to a Maps search using lat/lng or the address text.
const buildLocateUrl = (event: DocumentData): string | null => {
  if (event.map_link) return event.map_link;
  if (event.location?.lat && event.location?.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${event.location.lat},${event.location.lng}`;
  }
  if (event.location?.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location.address)}`;
  }
  return null;
};

export const EventDetail: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTeamChoice, setShowTeamChoice] = useState(false);
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [joinCodeError, setJoinCodeError] = useState('');
  const [teamError, setTeamError] = useState('');

  // Payment (only used when event.is_paid)
  const [showPayment, setShowPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  // Holds team details already collected while we wait for payment, so
  // the actual team registration only fires after a UTR is submitted.
  const [pendingTeam, setPendingTeam] = useState<{ teamName: string; teammates: { name: string; email?: string }[] } | null>(null);

  // External-form flow: after opening the form we show a "confirm" step
  const [formOpened, setFormOpened] = useState(false);
  // Where to go once the success animation finishes playing
  const [successNext, setSuccessNext] = useState<string | null>(null);

  // Enrollment state
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [registrationData, setRegistrationData] = useState<DocumentData | null>(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    getEventById(eventId)
      .then((ev) => {
        setEvent(ev);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch event:', err);
        setLoading(false);
      });
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !userData?.id) {
      setCheckingEnrollment(false);
      return;
    }

    // Check real registration data from Firebase
    const checkEnrollment = async () => {
      try {
        setCheckingEnrollment(true);
        const regs = await getUserRegistrations(userData.id) as DocumentData[];
        // Filter for active registrations for this event
        const activeRegs = regs.filter(
          r => r.event_id === eventId && r.status !== 'cancelled'
        );

        if (activeRegs.length > 0) {
          // If multiple found (e.g. team member vs leader duplicate?), take the first one
          setIsEnrolled(true);
          setRegistrationData(activeRegs[0]);
        } else {
          setIsEnrolled(false);
          setRegistrationData(null);
        }
      } catch (err) {
        console.error('Error checking enrollment state:', err);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkEnrollment();
  }, [eventId, userData?.id]);

  const handleCancelEnrollment = async () => {
    if (!userData?.id || !eventId) return;

    setCancelling(true);
    setError('');

    try {
      await cancelRegistration(userData.id, eventId);
      // Immediately clear local enrolled state to reflect success
      setIsEnrolled(false);
      setRegistrationData(null);
      setShowCancelConfirm(false);

      // Also optionally refresh the event to get updated seat counts
      const updatedEvent = await getEventById(eventId);
      if (updatedEvent) setEvent(updatedEvent);

    } catch (err) {
      console.error('Failed to cancel enrollment:', err);
      setError(err instanceof Error ? err.message : 'Could not cancel your enrollment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const doRegister = async (payment?: PaymentProof) => {
    if (!userData || !eventId) return;
    setError('');
    setRegistering(true);
    try {
      const result = await registerForEvent(
        userData.id, eventId, userData.department,
        { name: userData.name, email: userData.email, reg_no: userData.reg_no, department: userData.department },
        payment
      );
      if (result.status === 'registered' && result.registrationId) {
        if (event?.sheet_webhook_url) {
          logRegistrationToSheet(event.sheet_webhook_url, {
            event_title: event.title,
            event_id: eventId,
            registration_id: result.registrationId,
            participant_name: userData.name,
            participant_email: userData.email,
            reg_no: userData.reg_no,
            department: userData.department,
            payment_status: payment ? 'pending_verification' : undefined,
            payment_utr: payment?.utr,
            payment_amount: payment?.amount != null ? String(payment.amount) : undefined,
            registered_at: new Date().toISOString(),
          });
        }
        setShowPayment(false);
        // The QR/ticket stays locked until a coordinator manually verifies
        // this UTR — let them know one is waiting instead of them having
        // to check every event's queue.
        if (payment && event?.coordinator_id) {
          createNotification(
            event.coordinator_id,
            'New Payment Submitted',
            `${userData.name} submitted a payment reference for ${event.title}. Tap to review.`,
            `/payments/${eventId}`
          );
          notifyPaymentSubmittedAPI(
            eventId,
            event.title,
            payment.utr,
            payment.amount,
            userData.name,
            event.coordinator_id
          );
        }
        setSuccessNext(`/ticket/${result.registrationId}`);
      } else {
        setError('The event is full — you have been added to the waitlist.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not register for this event';
      if (payment) setPaymentError(msg); else setError(msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleEnrollClick = () => {
    if (!event) return;
    if (event.external_form_url) {
      window.open(event.external_form_url, '_blank', 'noopener,noreferrer');
      setFormOpened(true);
      return;
    }
    if (event.team_based) {
      setJoinCodeError('');
      setShowTeamChoice(true);
      return;
    }
    if (event.is_paid) {
      setPaymentError('');
      setShowPayment(true);
      return;
    }
    doRegister();
  };

  const handleJoinWithCode = async (code: string) => {
    if (!eventId) return;
    setJoiningByCode(true);
    setJoinCodeError('');
    try {
      const team = await getTeamByCode(eventId, code);
      if (!team) {
        setJoinCodeError('No team found with that code for this event. Check with your team leader.');
        return;
      }
      navigate(`/join-team/${team.id}`);
    } catch (e) {
      setJoinCodeError(e instanceof Error ? e.message : 'Could not look up that code.');
    } finally {
      setJoiningByCode(false);
    }
  };

  const handleCreateNewTeam = () => {
    setShowTeamChoice(false);
    setTeamError('');
    setShowTeamModal(true);
  };

  // After the student says they've submitted the external form, we
  // register them normally so a ticket gets generated. We can't detect
  // an actual return from the external tab, so this is a manual confirm.
  const handleConfirmExternalForm = async () => {
    await doRegister();
  };

  const finishTeamRegistration = async (
    teamName: string,
    teammates: { name: string; email?: string }[],
    payment?: PaymentProof
  ) => {
    if (!userData || !eventId || !event) return;
    setRegistering(true);
    try {
      const members = [{ name: userData.name, email: userData.email, uid: userData.id, reg_no: userData.reg_no, department: userData.department }, ...teammates.map((t: any) => ({ name: t.name, email: t.email, uid: t.uid || t.id || undefined, reg_no: undefined, department: userData.department }))];
      const result = await registerTeamForEvent(userData.id, eventId, userData.department, teamName, members, payment);
      if (event.sheet_webhook_url) {
        result.registrationIds.forEach((regId, i) => {
          logRegistrationToSheet(event.sheet_webhook_url!, {
            event_title: event.title,
            event_id: eventId,
            registration_id: regId,
            participant_name: members[i].name,
            participant_email: members[i].email,
            reg_no: i === 0 ? userData.reg_no : undefined,
            department: userData.department,
            team_name: teamName,
            team_id: result.teamId,
            is_leader: i === 0,
            payment_status: payment ? 'pending_verification' : undefined,
            payment_utr: i === 0 ? payment?.utr : undefined,
            payment_amount: i === 0 && payment?.amount != null ? String(payment.amount) : undefined,
            registered_at: new Date().toISOString(),
          });
        });
      }
      setShowTeamModal(false);
      setShowPayment(false);
      setPendingTeam(null);
      if (payment && event?.coordinator_id) {
        createNotification(
          event.coordinator_id,
          'New Payment Submitted',
          `${teamName} (led by ${userData.name}) submitted a payment reference for ${event.title}. Tap to review.`,
          `/payments/${eventId}`
        );
        notifyPaymentSubmittedAPI(
          eventId,
          event.title,
          payment.utr,
          payment.amount,
          userData.name,
          event.coordinator_id,
          teamName
        );
      }

      // Notify team members of registration
      const memberUids = members.map(m => m.uid).filter((uid): uid is string => Boolean(uid));
      if (memberUids.length > 0) {
        notifyTeamRegisteredAPI(memberUids, event.title, teamName);
      }
      // Team leaders go to the invite-link screen first so they can share
      // it — the team-tickets list (with everyone who's joined so far) is
      // still one tap away from there.
      setSuccessNext(`/team-invite/${result.teamId}?ticket=${result.registrationIds[0]}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not register your team';
      if (payment) setPaymentError(msg); else setTeamError(msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleTeamSubmit = async (teamName: string, teammates: { name: string; email?: string }[]) => {
    if (!teamName) {
      setTeamError('Team name is required.');
      return;
    }
    setTeamError('');
    if (event?.is_paid) {
      // Hold the team details and collect payment before actually
      // registering anyone — registerTeamForEvent takes the payment
      // proof as part of the same call.
      setPendingTeam({ teamName, teammates });
      setShowTeamModal(false);
      setPaymentError('');
      setShowPayment(true);
      return;
    }
    await finishTeamRegistration(teamName, teammates);
  };

  if (loading) {
    return <LoadingScreen message="Loading event details..." />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
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
  const isFull = event.available_seats !== null && event.available_seats !== undefined && event.available_seats <= 0;
  const regClosed = isRegistrationClosed(event);
  const locateUrl = buildLocateUrl(event);

  return (
    <div className="min-h-screen bg-transparent font-sans pb-36 flex flex-col items-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      
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
            <div className="w-full h-full bg-gradient-to-br from-[#3B9EFF] to-[#007AFF]"></div>
          )}
          
          {/* Top Overlays Container (Fixes Overlap) */}
          <div className="absolute top-5 left-5 right-5 flex justify-between items-start gap-4">
            
            {/* Location Pill Overlay — clickable, opens the Locate link */}
            {event.location?.address && (
              <button
                type="button"
                onClick={() => locateUrl && window.open(locateUrl, '_blank', 'noopener,noreferrer')}
                className="flex-1 min-w-0 max-w-fit bg-black/50 backdrop-blur-xl border border-white/10 text-white text-[13px] font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg hover:bg-black/65 transition-colors"
              >
                <MapPin size={16} strokeWidth={2.5} className="shrink-0 text-white/80" /> 
                <span className="truncate">{event.location.address}</span>
              </button>
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

        {/* Organizer Card */}
        {(event.contact_name || event.contact_phone) && (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,100,200,0.04)] border border-white transition-all hover:shadow-[0_16px_50px_rgba(0,100,200,0.08)]">
            <h3 className="text-[22px] font-extrabold text-[#1D1D1F] mb-4 tracking-tight">Organizer</h3>
            <div className="flex flex-wrap gap-3">
              {event.contact_name && (
                <span className="flex items-center gap-2 bg-[#F9F9FB] px-4 py-2.5 rounded-full border border-black/5 text-[14px] font-bold text-[#1D1D1F]">
                  <User size={16} className="text-[#3B9EFF]" /> {event.contact_name}
                </span>
              )}
              {event.contact_phone && (
                <a
                  href={`tel:${event.contact_phone}`}
                  className="flex items-center gap-2 bg-[#F9F9FB] px-4 py-2.5 rounded-full border border-black/5 text-[14px] font-bold text-[#1D1D1F] hover:bg-black/5 transition-colors"
                >
                  <Phone size={16} className="text-[#3B9EFF]" /> {event.contact_phone}
                </a>
              )}
            </div>
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
                    <span className="inline-flex w-fit text-[13px] text-[#3B9EFF] font-extrabold bg-[#3B9EFF]/10 px-4 py-2 rounded-full tracking-wide">
                      {row.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Card — interactive map optional, Locate button always shown when we have somewhere to send them */}
        {(event.location?.address || locateUrl) && (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,100,200,0.04)] border border-white transition-all hover:shadow-[0_16px_50px_rgba(0,100,200,0.08)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[22px] font-extrabold text-[#1D1D1F] tracking-tight">Location</h3>
              {locateUrl && (
                <button
                  onClick={() => window.open(locateUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-2 bg-[#1D1D1F] text-white text-[13px] font-bold px-4 py-2.5 rounded-full hover:bg-black transition-colors shadow-sm active:scale-95"
                >
                  <Navigation size={15} /> Locate
                </button>
              )}
            </div>

            {event.use_map !== false && event.location?.lat && event.location?.lng ? (
              <div className="rounded-[28px] overflow-hidden border border-black/5 shadow-inner">
                <EventMap lat={event.location.lat} lng={event.location.lng} label={event.title} />
              </div>
            ) : (
              <p className="text-[15px] text-[#5E6C84] font-medium">{event.location?.address || 'Location details available via the Locate button.'}</p>
            )}
          </div>
        )}
      </div>

      {/* Premium Glassy Sticky Bottom Action Bar (Pill) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/75 backdrop-blur-3xl border border-white/80 shadow-[0_12px_40px_rgba(0,100,200,0.18)]">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-[#86868B] uppercase tracking-wider mb-0.5">Starting From</p>
            <p className="text-[22px] font-black text-[#1D1D1F] leading-none tracking-tight">
              {event.registration_fee ? `₹${event.registration_fee}` : 'Free'}
            </p>
          </div>

          {isEnrolled ? (
            <div className="flex items-center gap-2">
              {registrationData?.id ? (
                <button
                  onClick={() => navigate(`/ticket/${registrationData.id}`)}
                  className="px-5 py-3 rounded-full text-[14px] font-extrabold transition-all shadow-[0_8px_25px_rgba(52,199,89,0.25)] flex items-center justify-center gap-2 bg-[#34C759] hover:bg-[#28A745] text-white active:scale-95 whitespace-nowrap"
                >
                  <Check size={16} strokeWidth={3} />
                  Enrolled<span className="hidden sm:inline"> (Ticket)</span>
                </button>
              ) : (
                <div className="px-5 py-3 rounded-full text-[14px] font-extrabold flex items-center justify-center gap-2 bg-[#34C759]/15 border border-[#34C759]/30 text-[#28A745]">
                  <Check size={16} strokeWidth={3} />
                  Enrolled
                </div>
              )}

              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelling}
                className="px-4 py-3 rounded-full text-[14px] font-extrabold transition-all shadow-[0_8px_20px_rgba(239,68,68,0.2)] flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white active:scale-95 disabled:opacity-50"
                title="Cancel Enrollment"
              >
                {cancelling ? (
                  <CompactLoader size="xs" className="text-white" />
                ) : (
                  <>
                    <X size={16} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Cancel</span>
                  </>
                )}
              </button>
            </div>
          ) : event.external_form_url && formOpened ? (
            <button
              onClick={handleConfirmExternalForm}
              disabled={registering}
              className="px-6 py-3 rounded-full text-[15px] font-extrabold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 bg-[#1D1D1F] hover:bg-black text-white active:scale-95"
            >
              {registering ? 'Confirming…' : "I've submitted the form"}
            </button>
          ) : (
            <button
              onClick={handleEnrollClick}
              disabled={registering || isFull || regClosed}
              className={`px-6 py-3 rounded-full text-[15px] font-extrabold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2
                ${isFull || regClosed
                  ? 'bg-gray-200 text-[#86868B] shadow-none cursor-not-allowed'
                  : 'bg-[#1D1D1F] hover:bg-black text-white active:scale-95'
                }`}
            >
              {registering ? (
                <span className="flex items-center gap-2">
                  <CompactLoader size="xs" className="text-white" />
                  Booking...
                </span>
              ) : regClosed ? (
                'Registration Closed'
              ) : isFull ? (
                'Event Full'
              ) : event.external_form_url ? (
                'Enroll'
              ) : (
                'Enroll'
              )}
            </button>
          )}
        </div>
      </div>

      <EnrollStatusOverlay
        phase={successNext ? 'success' : registering ? 'enrolling' : 'idle'}
        title="Registration Complete"
        subtitle={event.team_based ? 'Your team tickets are ready' : 'Your ticket is ready'}
        onDone={() => { if (successNext) navigate(successNext); }}
      />

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-1">Cancel Enrollment?</h3>
            <p className="text-[14px] text-[#5E6C84] mb-6">
              Are you sure you want to cancel your enrollment for <strong className="text-gray-800">{event?.title}</strong>? Your seat will be released.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 py-3 px-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[14px] transition-colors disabled:opacity-50"
              >
                Keep Seat
              </button>
              <button
                onClick={handleCancelEnrollment}
                disabled={cancelling}
                className="flex-1 py-3 px-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-red-500/20"
              >
                {cancelling ? (
                  <>
                    <CompactLoader size="xs" className="text-white" />
                    <span>Wait...</span>
                  </>
                ) : (
                  <>
                    <X size={16} strokeWidth={2.5} />
                    <span>Yes, Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <TeamChoiceModal
        isOpen={showTeamChoice}
        onClose={() => setShowTeamChoice(false)}
        onJoinWithCode={handleJoinWithCode}
        onCreateNew={handleCreateNewTeam}
        joining={joiningByCode}
        error={joinCodeError}
      />

      <TeamEnrollModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        leaderName={userData?.name || ''}
        leaderId={userData?.id || ''}
        maxTeamSize={event.team_size || 4}
        minTeamSize={event.min_team_size || 1}
        requiresEmail={!!event.requires_email}
        submitting={registering}
        error={teamError}
        onSubmit={handleTeamSubmit}
      />

      {event.is_paid && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => { setShowPayment(false); setPendingTeam(null); }}
          amount={event.registration_fee || 0}
          upiId={event.upi_id}
          qrImage={event.payment_qr_image}
          payeeName={event.contact_name || event.coordinator_name || 'Event Organizer'}
          eventTitle={event.title}
          submitting={registering}
          error={paymentError}
          onSubmit={(proof) => {
            if (pendingTeam) finishTeamRegistration(pendingTeam.teamName, pendingTeam.teammates, proof);
            else doRegister(proof);
          }}
        />
      )}
    </div>
  );
};

export default EventDetail;
