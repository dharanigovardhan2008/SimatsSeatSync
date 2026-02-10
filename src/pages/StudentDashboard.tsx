// Student Dashboard Page - Enhanced with Waitlist, Compliance, and Branch-specific features
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  subscribeToEvents, 
  registerForEvent, 
  getUserRegistrations,
  cancelRegistration,
  getStudentCompliance,
  subscribeToWaitlist
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

interface ComplianceData {
  mandatory: { event: DocumentData; completed: boolean }[];
  compliancePercent: number;
  isCompliant: boolean;
}

export const StudentDashboard: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [waitlistedEvents, setWaitlistedEvents] = useState<Map<string, number>>(new Map());
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);
  const [cancellingEvent, setCancellingEvent] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [activeTab, setActiveTab] = useState<'workshops' | 'my-registrations' | 'compliance'>('workshops');

  // Redirect if not logged in or not a student
  useEffect(() => {
    if (!authLoading && (!user || !userData)) {
      navigate('/login');
    } else if (!authLoading && userData && userData.role !== 'student') {
      navigate('/admin');
    }
  }, [user, userData, authLoading, navigate]);

  // Subscribe to events in real-time (filtered by branch)
  useEffect(() => {
    const unsubscribe = subscribeToEvents((eventsData: DocumentData[]) => {
      // Filter events based on student's department
      const filteredEvents = (eventsData as EventData[]).filter(event => {
        if (!event.target_branches || event.target_branches.length === 0) {
          return true; // Event is for all branches
        }
        return event.target_branches.includes(userData?.department || '');
      });
      setEvents(filteredEvents);
    });

    return () => unsubscribe();
  }, [userData?.department]);

  // Fetch user's registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (user) {
        try {
          const regs = await getUserRegistrations(user.uid);
          const regEventIds = new Set(regs.map((r: DocumentData) => r.event_id as string));
          setRegisteredEvents(regEventIds);
        } catch (error) {
          console.error('Error fetching registrations:', error);
        }
      }
    };

    fetchRegistrations();
  }, [user]);

  // Subscribe to waitlist
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = subscribeToWaitlist((waitlistData: DocumentData[]) => {
      const userWaitlist = new Map<string, number>();
      waitlistData
        .filter(w => w.user_id === user.uid)
        .forEach(w => {
          userWaitlist.set(w.event_id, w.position);
        });
      setWaitlistedEvents(userWaitlist);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch compliance status
  useEffect(() => {
    const fetchCompliance = async () => {
      if (user && userData) {
        try {
          const status = await getStudentCompliance(user.uid, userData.department);
          setCompliance(status);
        } catch (error) {
          console.error('Error fetching compliance:', error);
        }
      }
    };

    fetchCompliance();
  }, [user, userData, registeredEvents]);

  const handleRegister = async (eventId: string) => {
    if (!user || !userData) return;

    setLoadingEvent(eventId);
    setMessage(null);

    try {
      const result = await registerForEvent(user.uid, eventId, userData.department);
      
      if (result.status === 'registered') {
        setRegisteredEvents(prev => new Set([...prev, eventId]));
        setMessage({ type: 'success', text: result.message });
      } else if (result.status === 'waitlisted') {
        setMessage({ type: 'info', text: result.message });
      }
      
      // Refresh registrations
      const regs = await getUserRegistrations(user.uid);
      const regEventIds = new Set(regs.map((r: DocumentData) => r.event_id as string));
      setRegisteredEvents(regEventIds);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoadingEvent(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
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

  const upcomingEvents = events.filter(e => e.status === 'Upcoming');
  const registeredEventsList = events.filter(e => registeredEvents.has(e.id));
  const waitlistedEventsList = events.filter(e => waitlistedEvents.has(e.id));

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-[#3D4852] tracking-tight">
            Welcome, {userData?.name}! 👋
          </h1>
          <p className="mt-3 text-[#6B7280] text-lg">
            Browse and register for upcoming workshops and seminars
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card hover={false} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Available Workshops</p>
              <p className="text-2xl font-bold text-[#3D4852]">{upcomingEvents.length}</p>
            </div>
          </Card>

          <Card hover={false} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#38B2AC] to-[#4FD1C5] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Enrolled</p>
              <p className="text-2xl font-bold text-[#3D4852]">{registeredEvents.size}</p>
            </div>
          </Card>

          <Card hover={false} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F6AD55] to-[#ED8936] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Waitlisted</p>
              <p className="text-2xl font-bold text-[#3D4852]">{waitlistedEvents.size}</p>
            </div>
          </Card>

          <Card hover={false} className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] ${
              compliance?.isCompliant 
                ? 'bg-gradient-to-br from-[#38B2AC] to-[#4FD1C5]'
                : 'bg-gradient-to-br from-[#FC8181] to-[#F56565]'
            }`}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Compliance</p>
              <p className="text-2xl font-bold text-[#3D4852]">{compliance?.compliancePercent || 0}%</p>
            </div>
          </Card>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-8 p-4 rounded-2xl ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700' 
              : message.type === 'info'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-red-50 text-red-600'
          } shadow-[inset_3px_3px_6px_rgba(0,0,0,0.05),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : message.type === 'info' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('workshops')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              activeTab === 'workshops'
                ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            Available Workshops
          </button>
          <button
            onClick={() => setActiveTab('my-registrations')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              activeTab === 'my-registrations'
                ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            My Enrollments ({registeredEvents.size + waitlistedEvents.size})
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'compliance'
                ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            Compliance
            {!compliance?.isCompliant && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'workshops' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              Available Workshops for {userData?.department}
            </h2>

            {upcomingEvents.length === 0 ? (
              <Card hover={false} className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] mb-6">
                  <svg className="w-10 h-10 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#3D4852] mb-2">No workshops available</h3>
                <p className="text-[#6B7280]">Check back later for new workshops and seminars</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => {
                  const isRegistered = registeredEvents.has(event.id);
                  const waitlistPosition = waitlistedEvents.get(event.id);
                  const isWaitlisted = waitlistPosition !== undefined;
                  const isFull = event.available_seats <= 0;

                  return (
                    <Card key={event.id} className="flex flex-col">
                      {/* Event Type & Mandatory Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
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
                        </div>
                        <span className={`text-sm font-medium ${
                          isFull ? 'text-red-500' : 'text-[#38B2AC]'
                        }`}>
                          {isFull ? 'Full' : `${event.available_seats} seats`}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 className="font-display font-bold text-xl text-[#3D4852] mb-3">
                        {event.title}
                      </h3>

                      {/* Event Date & Time */}
                      <div className="flex items-center gap-2 text-[#6B7280] mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{formatDate(event.date)}</span>
                      </div>
                      
                      {(event.start_time || event.end_time) && (
                        <div className="flex items-center gap-2 text-[#6B7280] mb-4">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </span>
                        </div>
                      )}

                      {/* Seat Progress */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-[#6B7280] mb-2">
                          <span>Enrollment</span>
                          <span>{event.total_seats - event.available_seats} / {event.total_seats}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull 
                                ? 'bg-gradient-to-r from-red-500 to-red-400'
                                : 'bg-gradient-to-r from-[#6C63FF] to-[#8B84FF]'
                            }`}
                            style={{ width: `${((event.total_seats - event.available_seats) / event.total_seats) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Register Button */}
                      <div className="mt-auto">
                        {isRegistered ? (
                          <div className="space-y-2">
                            <Button variant="secondary" className="w-full" disabled>
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5 text-[#38B2AC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Enrolled
                              </span>
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              className="w-full"
                              onClick={() => handleCancel(event.id)}
                              isLoading={cancellingEvent === event.id}
                            >
                              Cancel Enrollment
                            </Button>
                          </div>
                        ) : isWaitlisted ? (
                          <div className="space-y-2">
                            <Button variant="secondary" className="w-full" disabled>
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5 text-[#F6AD55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Waitlist #{waitlistPosition}
                              </span>
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              className="w-full"
                              onClick={() => handleCancel(event.id)}
                              isLoading={cancellingEvent === event.id}
                            >
                              Leave Waitlist
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="primary" 
                            className="w-full"
                            onClick={() => handleRegister(event.id)}
                            isLoading={loadingEvent === event.id}
                          >
                            {isFull ? 'Join Waitlist' : 'Enroll Now'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-registrations' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              My Enrollments
            </h2>

            {registeredEventsList.length === 0 && waitlistedEventsList.length === 0 ? (
              <Card hover={false} className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] mb-6">
                  <svg className="w-10 h-10 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#3D4852] mb-2">No enrollments yet</h3>
                <p className="text-[#6B7280]">Browse available workshops and enroll!</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Confirmed Registrations */}
                {registeredEventsList.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-[#3D4852] mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#38B2AC]"></span>
                      Confirmed ({registeredEventsList.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {registeredEventsList.map(event => (
                        <Card key={event.id} className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                            </div>
                            <h4 className="font-bold text-[#3D4852]">{event.title}</h4>
                            <p className="text-sm text-[#6B7280]">{formatDate(event.date)}</p>
                          </div>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleCancel(event.id)}
                            isLoading={cancellingEvent === event.id}
                          >
                            Cancel
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Waitlisted */}
                {waitlistedEventsList.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-[#3D4852] mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#F6AD55]"></span>
                      Waitlisted ({waitlistedEventsList.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {waitlistedEventsList.map(event => (
                        <Card key={event.id} className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.type === 'Workshop'
                                  ? 'bg-[#6C63FF]/10 text-[#6C63FF]'
                                  : 'bg-[#38B2AC]/10 text-[#38B2AC]'
                              }`}>
                                {event.type}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                                Position #{waitlistedEvents.get(event.id)}
                              </span>
                            </div>
                            <h4 className="font-bold text-[#3D4852]">{event.title}</h4>
                            <p className="text-sm text-[#6B7280]">{formatDate(event.date)}</p>
                          </div>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleCancel(event.id)}
                            isLoading={cancellingEvent === event.id}
                          >
                            Leave
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              Academic Compliance Status
            </h2>

            {/* Compliance Overview */}
            <Card hover={false} className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    compliance?.isCompliant 
                      ? 'bg-gradient-to-br from-[#38B2AC] to-[#4FD1C5]'
                      : 'bg-gradient-to-br from-[#FC8181] to-[#F56565]'
                  } shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]`}>
                    <span className="text-3xl font-bold text-white">
                      {compliance?.compliancePercent || 0}%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#3D4852]">
                      {compliance?.isCompliant ? 'Compliant' : 'Pending Compliance'}
                    </h3>
                    <p className="text-[#6B7280]">
                      {compliance?.mandatory?.filter(m => m.completed).length || 0} of {compliance?.mandatory?.length || 0} mandatory workshops completed
                    </p>
                  </div>
                </div>
                
                {!compliance?.isCompliant && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>Action Required:</strong> Complete all mandatory workshops to achieve compliance.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Mandatory Workshops List */}
            <h3 className="text-lg font-medium text-[#3D4852] mb-4">
              Mandatory Workshops for {userData?.department}
            </h3>
            
            {!compliance?.mandatory || compliance.mandatory.length === 0 ? (
              <Card hover={false} className="text-center py-12">
                <p className="text-[#6B7280]">No mandatory workshops assigned to your department</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {compliance.mandatory.map(({ event, completed }) => (
                  <Card key={event.id} hover={false} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        completed 
                          ? 'bg-[#38B2AC]/10'
                          : 'bg-[#FC8181]/10'
                      }`}>
                        {completed ? (
                          <svg className="w-5 h-5 text-[#38B2AC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-[#FC8181]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-[#3D4852]">{event.title}</h4>
                        <p className="text-sm text-[#6B7280]">{formatDate(event.date)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      completed 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {completed ? 'Completed' : 'Pending'}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
