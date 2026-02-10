// Admin Events Management Page - Enhanced with Branch-specific and Mandatory settings
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

export const AdminEvents: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
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
      setEvents(data as EventData[]);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
        title: '', 
        type: 'Workshop', 
        date: '', 
        start_time: '',
        end_time: '',
        total_seats: '',
        is_mandatory: false,
        target_branches: []
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message.text}
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
                  <label className="text-sm font-medium text-[#3D4852]">
                    Target Departments
                  </label>
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
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  isLoading={loading}
                >
                  Create Workshop
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Events List */}
        <div>
          <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
            All Workshops ({events.length})
          </h2>

          {events.length === 0 ? (
            <Card hover={false} className="text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] mb-6">
                <svg className="w-10 h-10 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#3D4852] mb-2">No workshops yet</h3>
              <p className="text-[#6B7280] mb-6">Create your first academic workshop</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                Create Workshop
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} hover={false} className="overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
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
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleStatusToggle(event.id, event.status)}
                        className="w-full"
                      >
                        {event.status === 'Upcoming' ? 'Close' : 'Reopen'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminEvents;
