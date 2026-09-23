import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EnrolledStudentsModal } from '@/components/events/EnrolledStudentsModal';
import { PaymentVerificationModal } from '@/components/events/PaymentVerificationModal';
import { getCoordinatorEvents, deleteEvent, calculateRevenue, type RevenueData } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

// An event is "completed" once its end time has passed.
const hasEnded = (event: DocumentData, now: Date): boolean => {
  if (!event.date) return false;
  const [y, m, d] = event.date.split('-').map(Number);
  const [h, min] = (event.end_time || '23:59').split(':').map(Number);
  return now >= new Date(y, m - 1, d, h, min, 0, 0);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (time?: string) => {
  if (!time) return '—';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  if (Number.isNaN(h)) return time;
  return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const CoordinatorDashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [events, setEvents] = useState<DocumentData[]>([]);
  const [now, setNow] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ id: string; title: string } | null>(null);
  const [verifyingPayments, setVerifyingPayments] = useState<{ id: string; title: string } | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  // One-shot read rather than a live listener — a coordinator's own event
  // list changes rarely, and listeners re-read every document on change.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getCoordinatorEvents(user.uid),
      calculateRevenue(user.uid)
    ])
      .then(([eventData, revenueData]) => {
        if (!cancelled) {
          setEvents(eventData);
          setRevenue(revenueData);
        }
      })
      .catch((err) => console.error('Could not load your events:', err));
    return () => { cancelled = true; };
  }, [user]);

  // Keeps the live/completed split fresh without needing a reload.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const { live, completed } = useMemo(() => {
    const live: DocumentData[] = [];
    const completed: DocumentData[] = [];
    events.forEach((e) => (hasEnded(e, now) ? completed : live).push(e));
    const byDate = (a: DocumentData, b: DocumentData) => (a.date < b.date ? -1 : 1);
    return { live: live.sort(byDate), completed: completed.sort(byDate).reverse() };
  }, [events, now]);

  const totalEnrolled = events.reduce((s, e) => s + (e.enrolled_count || 0), 0);
  const totalTeams = events.reduce((s, e) => s + (e.team_count || 0), 0);

  const handleDelete = async (eventId: string) => {
    await deleteEvent(eventId);
    setDeleteConfirm(null);
  };

  const renderCard = (ev: DocumentData, isCompleted: boolean) => {
    const isAwaitingDelete = deleteConfirm === ev.id;
    const unlimited = ev.total_seats === null || ev.total_seats === undefined;

    return (
      <div key={ev.id} className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-4 shadow-[0_12px_40px_rgba(0,100,200,0.08)] hover:shadow-[0_18px_50px_rgba(0,100,200,0.12)] transition-all border border-white flex flex-col group relative overflow-hidden">
        {isAwaitingDelete && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-bold text-[#1D1D1F] text-[16px]">Delete this event?</p>
            <p className="text-xs text-[#5E6C84]">
              This also removes all of its registrations and cannot be undone.
            </p>
            <div className="flex gap-2 w-full max-w-[240px]">
              <button
                onClick={() => handleDelete(ev.id!)}
                className="flex-1 py-2 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-[12px] shadow-sm transition-all"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 px-3 rounded-full bg-gray-200 hover:bg-gray-300 text-[#1D1D1F] font-bold text-[12px] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Top Image Section */}
        {ev.images?.[0] ? (
          <div className="w-full h-[160px] rounded-[24px] overflow-hidden relative mb-4 bg-gray-100">
            <img
              src={ev.images[0]}
              alt={ev.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {ev.is_mandatory && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-sm">
                  Mandatory
                </span>
              )}
              {ev.team_based && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm">
                  Team
                </span>
              )}
              {isCompleted && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-800 text-white shadow-sm">
                  Completed
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-[160px] bg-white/50 rounded-[24px] flex items-center justify-center text-[#5E6C84] font-bold text-[13px] mb-4 border border-white relative">
            <span>No Image Available</span>
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {ev.is_mandatory && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-sm">
                  Mandatory
                </span>
              )}
              {ev.team_based && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm">
                  Team
                </span>
              )}
              {isCompleted && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-800 text-white shadow-sm">
                  Completed
                </span>
              )}
            </div>
          </div>
        )}

        <div className="px-1 flex flex-col gap-3 flex-1">
          {/* Title & Arrow Button Row */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#3B9EFF]/10 text-[#3B9EFF] mb-1.5">
                {ev.type || 'Event'}
              </span>
              <Link to={`/event/${ev.id}`}>
                <h3 className="font-bold text-[18px] text-[#1D1D1F] leading-tight tracking-tight hover:underline line-clamp-1">
                  {ev.title}
                </h3>
              </Link>
            </div>

            <Link
              to={`/event/${ev.id}`}
              className="w-10 h-10 bg-[#1D1D1F]/90 backdrop-blur-md rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
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
              <span className="truncate">{ev.location?.address || 'SIMATS Campus'}</span>
            </div>
            <span className="font-extrabold text-[#1D1D1F] shrink-0">
              {ev.registration_fee && ev.registration_fee > 0 ? `₹${ev.registration_fee}` : 'Free'}
            </span>
          </div>

          {/* Date & Time Glassy Pill Bar */}
          <div className="flex items-center justify-between bg-white/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/50">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-[14px] h-[14px] text-[#5E6C84]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[12px] font-bold text-[#1D1D1F]">
                {formatDate(ev.date)}
              </span>
            </div>
            <span className="text-[12px] font-bold text-[#5E6C84]">
              {formatTime(ev.start_time)}
            </span>
          </div>

          {/* Registration figures */}
          <div className="grid grid-cols-3 gap-2 my-1">
            <div className="p-2.5 rounded-2xl bg-white/60 backdrop-blur-md text-center border border-white/60">
              <p className="text-[10px] text-[#5E6C84] font-bold uppercase tracking-wide">
                {isCompleted ? 'Attended' : 'Enrolled'}
              </p>
              <p className="text-base font-extrabold text-[#1D1D1F]">{ev.enrolled_count || 0}</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/60 backdrop-blur-md text-center border border-white/60">
              <p className="text-[10px] text-[#5E6C84] font-bold uppercase tracking-wide">Teams</p>
              <p className="text-base font-extrabold text-[#1D1D1F]">{ev.team_count || 0}</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/60 backdrop-blur-md text-center border border-white/60">
              <p className="text-[10px] text-[#5E6C84] font-bold uppercase tracking-wide">Seats</p>
              <p className="text-base font-extrabold text-[#1D1D1F]">
                {unlimited ? '∞' : `${ev.available_seats ?? 0}/${ev.total_seats}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (ev.sheet_view_url) window.open(ev.sheet_view_url, '_blank', 'noopener,noreferrer');
                  else setViewing({ id: ev.id!, title: ev.title });
                }}
                className="py-2.5 px-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-bold text-[12px] transition-all shadow-sm active:scale-95 text-center truncate"
              >
                {ev.sheet_view_url ? 'Sheet' : 'Students'}
              </button>
              <Link to={`/scan/${ev.id}`} className="w-full">
                <button className="w-full py-2.5 px-3 rounded-full bg-white/80 hover:bg-white text-[#1D1D1F] font-bold text-[12px] border border-white/80 transition-all shadow-sm active:scale-95 text-center">
                  Scan QR
                </button>
              </Link>
            </div>

            {ev.is_paid && (
              <button
                onClick={() => setVerifyingPayments({ id: ev.id!, title: ev.title })}
                className="w-full py-2.5 px-3 rounded-full bg-[#3B9EFF]/10 hover:bg-[#3B9EFF]/20 text-[#007AFF] font-bold text-[12px] border border-[#3B9EFF]/20 transition-all shadow-sm active:scale-95 text-center"
              >
                Payment Verification
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Link to={`/event/${ev.id}`} className="w-full">
                <button className="w-full py-2 rounded-full bg-white/80 hover:bg-white text-[#1D1D1F] font-bold text-[11px] border border-white/80 transition-all shadow-sm active:scale-95 text-center">
                  View
                </button>
              </Link>
              {!isCompleted && (
                <Link to={`/coordinator/events/${ev.id}/edit`} className="w-full">
                  <button className="w-full py-2 rounded-full bg-white/80 hover:bg-white text-[#1D1D1F] font-bold text-[11px] border border-white/80 transition-all shadow-sm active:scale-95 text-center">
                    Edit
                  </button>
                </Link>
              )}
              <button
                onClick={() => setDeleteConfirm(ev.id!)}
                className={`py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-[11px] border border-red-500/20 transition-all shadow-sm active:scale-95 text-center ${isCompleted ? 'col-span-2' : ''}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-extrabold text-3xl text-[#3D4852]">
              Welcome, {userData?.name}!
            </h1>
            <p className="text-[#6B7280] mt-1">Manage the events you're coordinating.</p>
          </div>
          <Link to="/coordinator/events/new">
            <Button variant="primary">+ New Event</Button>
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Live Events', value: live.length, icon: '📅' },
            { label: 'Completed', value: completed.length, icon: '✅' },
            { label: 'Total Registered', value: totalEnrolled, icon: '👥' },
            { label: 'Total Teams', value: totalTeams, icon: '🏆' },
          ].map((s) => (
            <div key={s.label} className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white text-center transition-transform hover:-translate-y-1">
              <p className="text-[24px] mb-2">{s.icon}</p>
              <p className="text-sm text-[#6B7280] font-semibold">{s.label}</p>
              <p className="text-2xl font-extrabold text-[#3D4852] mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Summary - only show if there are paid events */}
        {revenue && revenue.totalRevenue > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-bold text-xl text-[#3D4852] mb-5">Revenue Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[28px] p-6 shadow-lg text-white">
                <p className="text-sm font-semibold opacity-90">Total Revenue</p>
                <p className="text-3xl font-black mt-2">₹{revenue.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-[#3B9EFF] to-[#007AFF] rounded-[28px] p-6 shadow-lg text-white">
                <p className="text-sm font-semibold opacity-90">Verified</p>
                <p className="text-3xl font-black mt-2">₹{revenue.verifiedRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[28px] p-6 shadow-lg text-white">
                <p className="text-sm font-semibold opacity-90">Pending Verification</p>
                <p className="text-3xl font-black mt-2">₹{revenue.pendingRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <Card hover={false}>
            <p className="text-center text-[#6B7280] py-8">
              You haven't created any events yet.
            </p>
          </Card>
        ) : (
          <>
            <h2 className="font-display font-bold text-xl text-[#3D4852] mb-5">
              Live Events ({live.length})
            </h2>
            {live.length === 0 ? (
              <Card hover={false} className="text-center py-10 mb-12">
                <p className="text-[#6B7280]">No live events right now.</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {live.map((ev) => renderCard(ev, false))}
              </div>
            )}

            {completed.length > 0 && (
              <>
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className="flex items-center gap-3 mb-5"
                >
                  <h2 className="font-display font-bold text-xl text-[#3D4852]">
                    Completed Events ({completed.length})
                  </h2>
                  <svg
                    className={`w-5 h-5 text-[#6B7280] transition-transform ${showCompleted ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCompleted && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completed.map((ev) => renderCard(ev, true))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {verifyingPayments && (
        <PaymentVerificationModal
          isOpen={!!verifyingPayments}
          onClose={() => setVerifyingPayments(null)}
          eventId={verifyingPayments.id}
          eventTitle={verifyingPayments.title}
        />
      )}

      {viewing && (
        <EnrolledStudentsModal
          isOpen={!!viewing}
          onClose={() => setViewing(null)}
          eventId={viewing.id}
          eventTitle={viewing.title}
        />
      )}
    </div>
  );
};

export default CoordinatorDashboard;
