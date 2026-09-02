import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/events/ImageUploader';
import { LocationPicker } from '@/components/events/LocationPicker';
import {
  createEvent,
  updateEvent,
  getEventById,
  DEPARTMENTS,
  type EventLocation,
  type EventTimelineItem,
  type EventType,
} from '@/lib/firebase';

const DEPT_OPTIONS = DEPARTMENTS.map((d) => ({ value: d, label: d }));

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'Seminar', label: 'Seminar' },
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Hackathon', label: 'Hackathon' },
];

export const CoordinatorEventForm: React.FC = () => {
  const { eventId } = useParams();
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('Seminar');
  const [about, setAbout] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<EventLocation | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [unlimitedSeats, setUnlimitedSeats] = useState(false);
  const [totalSeats, setTotalSeats] = useState(50);
  const [fee, setFee] = useState(0);
  const [targetBranches, setTargetBranches] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<EventTimelineItem[]>([{ time: '', title: '' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !eventId) return;
    (async () => {
      const ev = await getEventById(eventId);
      if (!ev) return;
      setTitle(ev.title || '');
      setType(ev.type || 'Seminar');
      setAbout(ev.about || '');
      setImages(ev.images || []);
      setLocation(ev.location || null);
      setDate(ev.date || '');
      setStartTime(ev.start_time || '');
      setEndTime(ev.end_time || '');
      const isUnlimited = ev.total_seats === null || ev.total_seats === undefined;
      setUnlimitedSeats(isUnlimited);
      setTotalSeats(isUnlimited ? 50 : ev.total_seats);
      setFee(ev.registration_fee || 0);
      setTargetBranches(ev.target_branches || []);
      setTimeline(ev.timeline?.length ? ev.timeline : [{ time: '', title: '' }]);
    })();
  }, [isEdit, eventId]);

  const toggleBranch = (branch: string) => {
    setTargetBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  const updateTimelineRow = (i: number, field: 'time' | 'title', value: string) => {
    setTimeline((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const addTimelineRow = () => setTimeline((prev) => [...prev, { time: '', title: '' }]);
  const removeTimelineRow = (i: number) => setTimeline((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Title, date, start time and end time are required.');
      return;
    }
    if (!unlimitedSeats && (!totalSeats || totalSeats < 1)) {
      setError('Enter a valid number of seats, or turn on Unlimited Seats.');
      return;
    }
    if (!user || !userData) return;

    setSaving(true);
    try {
      const payload = {
        title,
        type,
        about,
        images,
        date,
        start_time: startTime,
        end_time: endTime,
        total_seats: unlimitedSeats ? null : totalSeats,
        registration_fee: fee,
        is_mandatory: false,
        target_branches: targetBranches,
        timeline: timeline.filter((t) => t.time && t.title),
        coordinator_id: user.uid,
        coordinator_name: userData.name,
        ...(location ? { location } : {}),
      };

      if (isEdit && eventId) {
        await updateEvent(eventId, payload);
      } else {
        await createEvent(payload);
      }
      navigate('/coordinator');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display font-extrabold text-3xl text-[#3D4852] mb-8">
          {isEdit ? 'Edit Event' : 'New Event'}
        </h1>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            <Input label="Event Name" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              options={TYPE_OPTIONS}
            />

            <div>
              <label className="block text-sm font-medium text-[#3D4852] mb-2">About</label>
              <textarea
                className="w-full px-5 py-4 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] focus:outline-none"
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="What is this event about?"
              />
            </div>

            <ImageUploader images={images} onChange={setImages} />

            <LocationPicker value={location} onChange={setLocation} />

            <div className="grid grid-cols-3 gap-4">
              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#3D4852]">Total Seats</label>
                  <label className="flex items-center gap-2 text-xs text-[#6B7280] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={unlimitedSeats}
                      onChange={(e) => setUnlimitedSeats(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#6C63FF]"
                    />
                    Unlimited seats
                  </label>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={unlimitedSeats ? '' : totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  disabled={unlimitedSeats}
                  placeholder={unlimitedSeats ? 'Unlimited' : undefined}
                  className={unlimitedSeats ? 'opacity-50 cursor-not-allowed' : ''}
                />
              </div>
              <Input
                label="Registration Fee (₹, 0 = free)"
                type="number"
                min={0}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3D4852] mb-2">
                Open to Departments (none selected = all)
              </label>
              <div className="flex flex-wrap gap-2">
                {DEPT_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleBranch(d.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      targetBranches.includes(d.value)
                        ? 'bg-[#6C63FF] text-white'
                        : 'bg-[#E0E5EC] text-[#3D4852] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3D4852] mb-2">Timeline</label>
              <div className="space-y-3">
                {timeline.map((row, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <Input
                      className="w-32"
                      placeholder="09:00 AM"
                      value={row.time}
                      onChange={(e) => updateTimelineRow(i, 'time', e.target.value)}
                    />
                    <Input
                      className="flex-1"
                      placeholder="Grand Opening Show"
                      value={row.title}
                      onChange={(e) => updateTimelineRow(i, 'title', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTimelineRow(i)}
                      className="text-red-500 text-sm px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addTimelineRow}>
                  + Add row
                </Button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={saving}>
              {isEdit ? 'Save Changes' : 'Publish Event'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CoordinatorEventForm;