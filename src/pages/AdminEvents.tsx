// Admin — Event Approvals & Management
// Admins don't create events; coordinators do. Admins approve or reject
// them, monitor enrolment, and can delete any event.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EnrolledStudentsModal } from '@/components/events/EnrolledStudentsModal';
import { PaymentVerificationModal } from '@/components/events/PaymentVerificationModal';
import { getAllEvents, deleteEvent, approveEvent, rejectEvent } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

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

export const AdminEvents: React.FC = () => {
  const { userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ id: string; title: string } | null>(null);
  const [verifyingPayments, setVerifyingPayments] = useState<{ id: string; title: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!authLoading && (!userData || userData.role !== 'admin')) navigate('/');
  }, [userData, authLoading, navigate]);

  // One-shot fetch instead of a live listener: this list changes rarely,
  // and a listener would re-read every document on each change, which
  // burns through the free Firestore read quota fast.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await getAllEvents());
    } catch (err) {
      console.error('Load events failed:', err);
      setMessage({ type: 'error', text: 'Could not load events.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const { pending, live, completed } = useMemo(() => {
    const pending: DocumentData[] = [];
    const live: DocumentData[] = [];
    const completed: DocumentData[] = [];
    events.forEach((e) => {
      if ((e.approval_status || 'pending') === 'pending') pending.push(e);
      else if (hasEnded(e, now)) completed.push(e);
      else live.push(e);
    });
    return { pending, live, completed };
  }, [events, now]);

  // Optimistic local update avoids a full refetch (and its read cost).
  const patchLocal = (id: string, patch: Partial<DocumentData>) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const handleApprove = async (ev: DocumentData) => {
    setBusy(ev.id);
    try {
      await approveEvent(ev.id!);
      patchLocal(ev.id!, { approval_status: 'approved' });
      setMessage({ type: 'success', text: `"${ev.title}" is now visible to students.` });
    } catch {
      setMessage({ type: 'error', text: 'Could not approve the event.' });
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (ev: DocumentData) => {
    const reason = window.prompt(`Why is "${ev.title}" being rejected? (optional)`) ?? '';
    setBusy(ev.id);
    try {
      await rejectEvent(ev.id!, reason);
      patchLocal(ev.id!, { approval_status: 'rejected', rejection_reason: reason });
      setMessage({ type: 'success', text: `"${ev.title}" was rejected.` });
    } catch {
      setMessage({ type: 'error', text: 'Could not reject the event.' });
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Event deleted, along with its registrations.' });
    } catch {
      setDeleteConfirm(null);
      setMessage({ type: 'error', text: 'Could not delete the event.' });
    }
  };

  const renderCard = (ev: DocumentData, variant: 'pending' | 'live' | 'completed') => {
    const isAwaitingDelete = deleteConfirm === ev.id;
    const unlimited = ev.total_seats === null || ev.total_seats === undefined;
    const rejected = ev.approval_status === 'rejected';

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
              {variant === 'pending' && !rejected && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-yellow-500 text-white shadow-sm">
                  Awaiting Approval
                </span>
              )}
              {rejected && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-sm">
                  Rejected
                </span>
              )}
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
              {variant === 'completed' && (
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
              {variant === 'pending' && !rejected && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-yellow-500 text-white shadow-sm">
                  Awaiting Approval
                </span>
              )}
              {rejected && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-sm">
                  Rejected
                </span>
              )}
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
              {variant === 'completed' && (
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
              <p className="text-[11px] text-[#A0AEC0] mt-0.5 truncate">
                By {ev.contact_name || ev.coordinator_name || 'Unknown'}
                {ev.contact_phone ? ` · ${ev.contact_phone}` : ''}
              </p>
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

          {rejected && ev.rejection_reason && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
              <strong>Reason:</strong> {ev.rejection_reason}
            </p>
          )}

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
                {variant === 'completed' ? 'Attended' : 'Enrolled'}
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
            {variant === 'pending' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleApprove(ev)}
                  disabled={busy === ev.id}
                  className="py-2.5 px-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-bold text-[12px] transition-all shadow-sm active:scale-95 text-center disabled:opacity-50"
                >
                  {busy === ev.id ? 'Approving...' : rejected ? 'Approve Anyway' : 'Approve'}
                </button>
                {!rejected && (
                  <button
                    onClick={() => handleReject(ev)}
                    disabled={busy === ev.id}
                    className="py-2.5 px-3 rounded-full bg-white/80 hover:bg-white text-[#1D1D1F] font-bold text-[12px] border border-white/80 transition-all shadow-sm active:scale-95 text-center disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            )}

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
                className="w-full py-2.5 px-3 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[12px] border border-indigo-100 transition-all shadow-sm active:scale-95 text-center"
              >
                Payment Verification
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Link to={`/event/${ev.id}`} className="w-full">
                <button className="w-full py-2 rounded-full bg-white/80 hover:bg-white text-[#1D1D1F] font-bold text-[11px] border border-white/80 transition-all shadow-sm active:scale-95 text-center">
                  View Event
                </button>
              </Link>
              <button
                onClick={() => setDeleteConfirm(ev.id!)}
                className="py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-[11px] border border-red-500/20 transition-all shadow-sm active:scale-95 text-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  const totalAttended = completed.reduce((s, e) => s + (e.enrolled_count || 0), 0);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="font-display font-extrabold text-3xl text-[#3D4852] tracking-tight">
              Event Approvals
            </h1>
            <p className="text-[#6B7280] mt-1">
              Coordinators submit events here. Students only see them once you approve.
            </p>
          </div>
          <Button variant="secondary" onClick={load}>Refresh</Button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Awaiting Approval', value: pending.filter((e) => e.approval_status !== 'rejected').length },
            { label: 'Live Events', value: live.length },
            { label: 'Completed', value: completed.length },
            { label: 'Total Attended', value: totalAttended },
          ].map((s) => (
            <Card key={s.label} hover={false} className="text-center">
              <p className="text-sm text-[#6B7280] font-semibold">{s.label}</p>
              <p className="text-2xl font-extrabold text-[#3D4852] mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Approval queue */}
        <h2 className="font-display font-bold text-xl text-[#3D4852] mb-5">
          Approval Requests ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card hover={false} className="text-center py-10 mb-12">
            <p className="text-[#6B7280]">Nothing waiting for review.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {pending.map((e) => renderCard(e, 'pending'))}
          </div>
        )}

        {/* Approved & live */}
        <h2 className="font-display font-bold text-xl text-[#3D4852] mb-5">
          Live Events ({live.length})
        </h2>
        {live.length === 0 ? (
          <Card hover={false} className="text-center py-10 mb-12">
            <p className="text-[#6B7280]">No live events right now.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {live.map((e) => renderCard(e, 'live'))}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <button onClick={() => setShowCompleted((v) => !v)} className="flex items-center gap-3 mb-5">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map((e) => renderCard(e, 'completed'))}
              </div>
            )}
          </>
        )}
      </main>

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

export default AdminEvents;
