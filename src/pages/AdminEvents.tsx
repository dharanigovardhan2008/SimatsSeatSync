// Admin — Event Approvals & Management
// Admins don't create events; coordinators do. Admins approve or reject
// them, monitor enrolment, and can delete any event.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
      <Card key={ev.id} hover={false} className="relative overflow-hidden">
        {isAwaitingDelete && (
          <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-bold text-[#3D4852]">Delete this event?</p>
            <p className="text-sm text-[#6B7280]">
              This also removes all of its registrations and can't be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" size="sm" onClick={() => handleDelete(ev.id!)}>Yes, delete</Button>
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#6C63FF]/10 text-[#6C63FF] uppercase">
            {ev.type || 'Event'}
          </span>
          {ev.team_based && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-700">
              Team event
            </span>
          )}
          {variant === 'pending' && !rejected && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-yellow-100 text-yellow-700">
              Awaiting approval
            </span>
          )}
          {rejected && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700">
              Rejected
            </span>
          )}
          {variant === 'completed' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gray-200 text-gray-600">
              Completed
            </span>
          )}
        </div>

        <h3 className="font-bold text-lg text-[#3D4852] truncate">{ev.title}</h3>
        <p className="text-sm text-[#6B7280]">
          {formatDate(ev.date)} · {formatTime(ev.start_time)} – {formatTime(ev.end_time)}
        </p>
        <p className="text-xs text-[#A0AEC0] mt-0.5">
          By {ev.contact_name || ev.coordinator_name || 'Unknown coordinator'}
          {ev.contact_phone ? ` · ${ev.contact_phone}` : ''}
        </p>
        {rejected && ev.rejection_reason && (
          <p className="text-xs text-red-600 mt-2">Reason: {ev.rejection_reason}</p>
        )}

        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-3 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] text-center">
            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wide">
              {variant === 'completed' ? 'Attended' : 'Enrolled'}
            </p>
            <p className="text-xl font-extrabold text-[#3D4852]">{ev.enrolled_count || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] text-center">
            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wide">Teams</p>
            <p className="text-xl font-extrabold text-[#3D4852]">{ev.team_count || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] text-center">
            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wide">Seats</p>
            <p className="text-xl font-extrabold text-[#3D4852]">
              {unlimited ? '∞' : `${ev.available_seats ?? 0}/${ev.total_seats}`}
            </p>
          </div>
        </div>

        {variant === 'pending' && (
          <div className="flex gap-2 mb-2">
            <Button
              variant="primary" size="sm" className="flex-1"
              isLoading={busy === ev.id}
              onClick={() => handleApprove(ev)}
            >
              {rejected ? 'Approve anyway' : 'Approve'}
            </Button>
            {!rejected && (
              <Button
                variant="secondary" size="sm" className="flex-1"
                disabled={busy === ev.id}
                onClick={() => handleReject(ev)}
              >
                Reject
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <Button
            variant="primary" size="sm" className="flex-1"
            onClick={() => {
              if (ev.sheet_view_url) window.open(ev.sheet_view_url, '_blank', 'noopener,noreferrer');
              else setViewing({ id: ev.id!, title: ev.title });
            }}
          >
            {ev.sheet_view_url ? 'Open Sheet' : 'View Registered Students'}
          </Button>
          <Link to={`/scan/${ev.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">Scan QR</Button>
          </Link>
        </div>

        {ev.is_paid && (
          <Button
            variant="secondary" size="sm" className="w-full mb-2"
            onClick={() => setVerifyingPayments({ id: ev.id!, title: ev.title })}
          >
            Payment Verification
          </Button>
        )}

        <div className="flex gap-2">
          <Link to={`/event/${ev.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">View</Button>
          </Link>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => setDeleteConfirm(ev.id!)}>
            Delete
          </Button>
        </div>
      </Card>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  const totalAttended = completed.reduce((s, e) => s + (e.enrolled_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
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