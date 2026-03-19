
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { 
  createEvent, 
  subscribeToEvents, 
  updateEventStatus,
  deleteEvent,
  DEPARTMENTS
} from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

interface EventData {
  id: string;
  title: string;
  type: 'Workshop' | 'Seminar';
  date: string;
  start_time?: string;
  end_time?: string;
  total_seats: number;
  available_seats: number;
  status: 'Upcoming' | 'Closed';
  is_mandatory?: boolean;
  target_branches?: string[];
}

const EVENT_TYPES = [
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Seminar', label: 'Seminar' }
];

// ─────────────────────────────────────────────────────────────
// Helper: decide whether an event should be hidden from the
// main list.
//
// Rules:
//  1. Event is hidden if its end_time on event date has passed.
//  2. Event is hidden if it starts within the next 2 hours
//     (i.e. start_time − now  ≤  2 hours AND it hasn't ended yet).
//
// Both comparisons use the local clock of whoever is viewing the
// admin panel, which is fine for a college-internal tool.
// ─────────────────────────────────────────────────────────────
const isEventHidden = (event: EventData): boolean => {
  if (!event.date) return false;

  const now = new Date();

  // Build full Date objects for start and end using the stored
  // "YYYY-MM-DD" date and "HH:MM" time strings.
  const buildDateTime = (dateStr: string, timeStr?: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr ? timeStr.split(':').map(Number) : [23, 59];
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  };

  const startDT = buildDateTime(event.date, event.start_time);
  const endDT   = buildDateTime(event.date, event.end_time);

  // Rule 1 — event has already ended
  if (now >= endDT) return true;

  // Rule 2 — event starts within the next 2 hours
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (startDT <= twoHoursFromNow) return true;

  return false;
};

// Human-readable countdown until the 2-hour threshold kicks in
const getTimeUntilHidden = (event: EventData): string | null => {
  if (!event.date || !event.start_time) return null;

  const now = new Date();
  const [year, month, day] = event.date.split('-').map(Number);
  const [hours, minutes] = event.start_time.split(':').map(Number);
  const startDT = new Date(year, month - 1, day, hours, minutes, 0, 0);

  const twoHourThreshold = new Date(startDT.getTime() - 2 * 60 * 60 * 1000);
  const diff = twoHourThreshold.getTime() - now.getTime();

  if (diff <= 0) return null; // already hidden

  const totalMinutes = Math.floor(diff / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0) return `Hides in ${h}h ${m}m`;
  return `Hides in ${m}m`;
};

export const AdminEvents: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // eventId awaiting confirm
  const [showHidden, setShowHidden] = useState(false);
  const [now, setNow] = useState(new Date());

  // Refresh "now" every minute so countdowns and auto-hide update live
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Workshop',
    date: '',
    start_time: '',
    end_time: '',
    total_seats: '',
    is_mandatory: false,
    target_branches: [] as string[]
  });

  // Redirect if not logged in or not an admin
  useEffect(() => {
    if (!authLoading && (!user || !userData)) {
      navigate('/login');
    } else if (!authLoading && userData && userData.role !== 'admin') {
      navigate('/student');
    }
  }, [user, userData, authLoading, navigate]);

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = subscribeToEvents((data: DocumentData[]) => {
      setAllEvents(data as EventData[]);
    });
    return () => unsubscribe();
  }, []);

  // Split into visible (active) and hidden (past / within 2 hours)
  // Re-evaluates every minute because `now` changes
  const visibleEvents = allEvents.filter(e => !isEventHidden(e));
  const hiddenEvents  = allEvents.filter(e =>  isEventHidden(e));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBranchToggle = (branch: string) => {
    setFormData(prev => ({
      ...prev,
      target_branches: prev.target_branches.includes(branch)
        ? prev.target_branches.filter(b => b !== branch)
        : [...prev.target_branches, branch]
    }));
  };

  const handleSelectAllBranches = () => {
    if (formData.target_branches.length === DEPARTMENTS.length) {
      setFormData(prev => ({ ...prev, target_branches: [] }));
    } else {
      setFormData(prev => ({ ...prev, target_branches: [...DEPARTMENTS] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await createEvent({
        title: formData.title,
        type: formData.type as 'Workshop' | 'Seminar',
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_seats: parseInt(formData.total_seats),
        is_mandatory: formData.is_mandatory,
        target_branches: formData.target_branches
      });
      setMessage({ type: 'success', text: 'Workshop created successfully!' });
      setFormData({ 
        title: '', type: 'Workshop', date: '', start_time: '',
        end_time: '', total_seats: '', is_mandatory: false, target_branches: []
      });
      setShowForm(false);
    } catch (err) {
      console.error('Create event error:', err);
      setMessage({ type: 'error', text: 'Failed to create workshop. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (eventId: string, currentStatus: 'Upcoming' | 'Closed') => {
    try {
      const newStatus = currentStatus === 'Upcoming' ? 'Closed' : 'Upcoming';
      await updateEventStatus(eventId, newStatus);
    } catch (err) {
      console.error('Update status error:', err);
      setMessage({ type: 'error', text: 'Failed to update event status.' });
    }
  };

  const handleDeleteConfirm = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Workshop deleted successfully.' });
    } catch (err) {
      console.error('Delete event error:', err);
      setMessage({ type: 'error', text: 'Failed to delete workshop. Please try again.' });
      setDeleteConfirm(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // ─── Shared event card renderer ──────────────────────────────
  const renderEventCard = (event: EventData, isPast = false) => {
    const isAwaitingDelete = deleteConfirm === event.id;
    const countdown = !isPast ? getTimeUntilHidden(event) : null;

    return (
      <Card key={event.id} hover={false} className={`overflow-hidden transition-opacity duration-300 ${isPast ? 'opacity-70' : ''}`}>
        {/* Delete confirmation overlay */}
        {isAwaitingDelete && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold text-[#3D4852] text-lg">Delete "{event.title}"?</p>
              <p className="text-sm text-[#6B7280] mt-1">
                This will also remove all registrations and waitlist entries. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-[#6B7280] bg-[#E0E5EC] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(event.id)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-400 shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)] hover:from-red-600 hover:to-red-500 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Event Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.type === 'Workshop'
                  ? 'bg-[#6C63FF]/10 text-[#6C63FF]'
                  : 'bg-[#38B2AC]/10 text-[#38B2AC]'
              }`}>
                {event.type}
              </span>
              {event.is_mandatory && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  Mandatory
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.status === 'Upcoming'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {event.status}
              </span>
              {isPast && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                  {now >= (() => {
                    const [y,m,d] = event.date.split('-').map(Number);
                    const [h,min] = (event.end_time || '23:59').split(':').map(Number);
                    return new Date(y, m-1, d, h, min);
                  })() ? 'Completed' : 'Starting Soon'}
                </span>
              )}
              {/* Countdown warning — only for visible events close to hiding */}
              {countdown && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 animate-pulse">
                  ⏳ {countdown}
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-[#3D4852] mb-1">{event.title}</h3>
            <p className="text-sm text-[#6B7280]">
              {formatDate(event.date)} • {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </p>
            {event.target_branches && event.target_branches.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {event.target_branches.map(branch => (
                  <span key={branch} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {branch}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Seat Info */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#3D4852]">
                {event.total_seats - event.available_seats}
              </p>
              <p className="text-xs text-[#6B7280]">Enrolled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#38B2AC]">
                {event.available_seats}
              </p>
              <p className="text-xs text-[#6B7280]">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#6B7280]">
                {event.total_seats}
              </p>
              <p className="text-xs text-[#6B7280]">Total</p>
            </div>
          </div>

          {/* Progress & Actions */}
          <div className="flex flex-col gap-2 min-w-[150px]">
            <div className="h-2 rounded-full bg-[#E0E5EC] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  event.available_seats === 0
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-[#6C63FF] to-[#8B84FF]'
                }`}
                style={{ width: `${((event.total_seats - event.available_seats) / event.total_seats) * 100}%` }}
              />
            </div>

            {/* Only show Close/Reopen for visible (non-past) events */}
            {!isPast && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleStatusToggle(event.id, event.status)}
                className="w-full"
              >
                {event.status === 'Upcoming' ? 'Close' : 'Reopen'}
              </Button>
            )}

            {/* Delete button — always visible */}
            <button
              onClick={() => setDeleteConfirm(event.id)}
              className="w-full px-3 py-1.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 shadow-[3px_3px_6px_rgb(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.5)] transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
          <div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-[#3D4852] tracking-tight">
              Workshop Management
            </h1>
            <p className="mt-3 text-[#6B7280] text-lg">
              Create and manage academic workshops and seminars
            </p>
          </div>
          
          <Button 
            variant="primary" 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            {showForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Workshop
              </>
            )}
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-8 p-4 rounded-2xl ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-600'
          } shadow-[inset_3px_3px_6px_rgba(0,0,0,0.05),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message.text}
              </div>
              <button onClick={() => setMessage(null)} className="text-current opacity-60 hover:opacity-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Create Event Form */}
        {showForm && (
          <Card className="mb-12">
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              Create New Workshop
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Workshop Title"
                  type="text"
                  name="title"
                  placeholder="Enter workshop title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
                <Select
                  label="Workshop Type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={EVENT_TYPES}
                />
                <Input
                  label="Workshop Date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Total Seats"
                  type="number"
                  name="total_seats"
                  placeholder="Enter total seats"
                  value={formData.total_seats}
                  onChange={handleChange}
                  min="1"
                  required
                />
                <Input
                  label="Start Time"
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="End Time"
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Mandatory Checkbox */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_mandatory"
                    checked={formData.is_mandatory}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C63FF]"></div>
                </label>
                <span className="text-[#3D4852] font-medium">Mark as Mandatory</span>
                <span className="text-sm text-[#6B7280]">(Students must complete this for compliance)</span>
              </div>

              {/* Target Branches */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-[#3D4852]">Target Departments</label>
                  <button
                    type="button"
                    onClick={handleSelectAllBranches}
                    className="text-sm text-[#6C63FF] hover:underline"
                  >
                    {formData.target_branches.length === DEPARTMENTS.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <p className="text-sm text-[#6B7280] mb-3">
                  Leave empty to make available for all departments
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DEPARTMENTS.map(branch => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => handleBranchToggle(branch)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        formData.target_branches.includes(branch)
                          ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                          : 'text-[#6B7280] bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Create Workshop
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── Active / Visible Events ── */}
        <div>
          <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
            Active Workshops ({visibleEvents.length})
          </h2>

          {visibleEvents.length === 0 ? (
            <Card hover={false} className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] mb-6">
                <svg className="w-10 h-10 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#3D4852] mb-2">No active workshops</h3>
              <p className="text-[#6B7280] mb-6">Create your first academic workshop</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Create Workshop
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {visibleEvents.map(event => renderEventCard(event, false))}
            </div>
          )}
        </div>

        {/* ── Past / Hidden Events (collapsible) ── */}
        {hiddenEvents.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setShowHidden(prev => !prev)}
              className="flex items-center gap-3 mb-6 group"
            >
              <h2 className="font-display font-bold text-2xl text-[#6B7280] group-hover:text-[#3D4852] transition-colors">
                Past / Hidden Workshops ({hiddenEvents.length})
              </h2>
              <svg
                className={`w-6 h-6 text-[#6B7280] transition-transform duration-300 ${showHidden ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHidden && (
              <>
                <p className="text-sm text-[#6B7280] mb-4 -mt-2">
                  These workshops are hidden from students. They were automatically hidden because they have already ended or start within 2 hours. You can delete them here.
                </p>
                <div className="space-y-4">
                  {hiddenEvents.map(event => renderEventCard(event, true))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminEvents;
