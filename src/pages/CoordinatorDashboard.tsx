import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EnrolledStudentsModal } from '@/components/events/EnrolledStudentsModal';
import { PaymentVerificationModal } from '@/components/events/PaymentVerificationModal';
import { getCoordinatorEvents, deleteEvent } from '@/lib/firebase';
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

  // One-shot read rather than a live listener — a coordinator's own event
  // list changes rarely, and listeners re-read every document on change.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCoordinatorEvents(user.uid)
      .then((data) => { if (!cancelled) setEvents(data); })
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
      <Card key={ev.id} hover={false} className="relative overflow-hidden">
        {isAwaitingDelete && (
          <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-bold text-[#3D4852]">Delete this event?</p>
            <p className="text-sm text-[#6B7280]">
              This also removes all of its registrations and can't be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" size="sm" onClick={() => handleDelete(ev.id!)}>
                Yes, delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
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
          {isCompleted && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gray-200 text-gray-600">
              Completed
            </span>
          )}
        </div>

        <h3 className="font-display font-bold text-xl text-[#3D4852] truncate">{ev.title}</h3>
        <p className="text-sm text-[#6B7280] mt-1">
          {formatDate(ev.date)} · {formatTime(ev.start_time)} – {formatTime(ev.end_time)}
        </p>

        {/* Registration figures */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-3 rounded-2xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] text-center">
            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wide">
              {isCompleted ? 'Attended' : 'Enrolled'}
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

        <div className="flex gap-2 mb-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
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
          {!isCompleted && (
            <Link to={`/coordinator/events/${ev.id}/edit`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">Edit</Button>
            </Link>
          )}
          <Button variant="danger" size="sm" className="flex-1" onClick={() => setDeleteConfirm(ev.id!)}>
            Delete
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
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
            { label: 'Live Events', value: live.length },
            { label: 'Completed', value: completed.length },
            { label: 'Total Registered', value: totalEnrolled },
            { label: 'Total Teams', value: totalTeams },
          ].map((s) => (
            <Card key={s.label} hover={false} className="text-center">
              <p className="text-sm text-[#6B7280] font-semibold">{s.label}</p>
              <p className="text-2xl font-extrabold text-[#3D4852] mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

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