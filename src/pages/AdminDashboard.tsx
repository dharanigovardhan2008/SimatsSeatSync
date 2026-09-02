// Admin Dashboard Page - Premium Apple Glassmorphism & Minimalist Design
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { 
  subscribeToUsers, 
  subscribeToEvents, 
  subscribeToRegistrations,
  subscribeToWaitlist,
  getEventAnalytics,
  blockUser,
  unblockUser,
  type EventAnalytics
} from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

interface UserData {
  id: string;
  name: string;
  reg_no: string;
  department: string;
  role: 'student' | 'admin';
  is_blocked?: boolean;
}

interface EventData {
  id: string;
  title: string;
  type: 'Workshop' | 'Seminar';
  date: string;
  total_seats: number;
  available_seats: number;
  status: 'Upcoming' | 'Closed';
  is_mandatory?: boolean;
}

interface RegistrationData {
  id: string;
  user_id: string;
  event_id: string;
}

interface WaitlistData {
  id: string;
  user_id: string;
  event_id: string;
  position: number;
}

export const AdminDashboard: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistData[]>([]);
  const [analytics, setAnalytics] = useState<EventAnalytics[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'all-users'>('overview');

  // All Users tab state
  const [userSearch, setUserSearch] = useState('');
  const [userDeptFilter, setUserDeptFilter] = useState('All');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [blockMessage, setBlockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !userData)) {
      navigate('/login');
    } else if (!authLoading && userData && userData.role !== 'admin') {
      navigate('/student');
    }
  }, [user, userData, authLoading, navigate]);

  useEffect(() => {
    const unsubUsers     = subscribeToUsers((data: DocumentData[]) => setUsers(data as UserData[]));
    const unsubEvents    = subscribeToEvents((data: DocumentData[]) => setEvents(data as EventData[]));
    const unsubRegs      = subscribeToRegistrations((data: DocumentData[]) => setRegistrations(data as RegistrationData[]));
    const unsubWaitlist  = subscribeToWaitlist((data: DocumentData[]) => setWaitlist(data as WaitlistData[]));
    return () => { unsubUsers(); unsubEvents(); unsubRegs(); unsubWaitlist(); };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsData = await getEventAnalytics();
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [registrations, waitlist]);

  // ── Helpers ──────────────────────────────────────────────
  const getUserRegistrations = (userId: string) =>
    registrations
      .filter(r => r.user_id === userId)
      .map(r => events.find(e => e.id === r.event_id))
      .filter(Boolean) as EventData[];

  const getWaitlistForEvent = (eventId: string) =>
    waitlist.filter(w => w.event_id === eventId).length;

  const totalSeats        = events.reduce((acc, e) => acc + e.total_seats, 0);
  const registeredSeats   = events.reduce((acc, e) => acc + (e.total_seats - e.available_seats), 0);
  const studentCount      = users.filter(u => u.role === 'student').length;
  const totalWaitlisted   = waitlist.length;

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'High':   return 'bg-red-500/10 text-red-600 border border-red-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'Low':    return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      default:       return 'bg-gray-500/10 text-gray-600 border border-gray-500/20';
    }
  };

  // ── All Users derived ─────────────────────────────────────
  const students       = users.filter(u => u.role === 'student');
  const blockedCount   = students.filter(s => s.is_blocked).length;
  const allDepartments = ['All', ...Array.from(new Set(students.map(s => s.department))).sort()];

  const filteredStudents = students.filter(s => {
    const matchSearch = 
      s.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      s.reg_no.toLowerCase().includes(userSearch.toLowerCase());
    const matchDept = userDeptFilter === 'All' || s.department === userDeptFilter;
    return matchSearch && matchDept;
  });

  // ── Block / Unblock handler ───────────────────────────────
  const handleToggleBlock = async (student: UserData) => {
    setBlockingUserId(student.id);
    setBlockMessage(null);
    try {
      if (student.is_blocked) {
        await unblockUser(student.id);
        setBlockMessage({ type: 'success', text: `${student.name} has been unblocked.` });
      } else {
        await blockUser(student.id);
        setBlockMessage({ type: 'success', text: `${student.name} has been blocked from registering.` });
      }
    } catch (err) {
      console.error('Block/unblock error:', err);
      setBlockMessage({ type: 'error', text: 'Failed to update user status. Please try again.' });
    } finally {
      setBlockingUserId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#EAF3FF] flex items-center justify-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="w-8 h-8 rounded-full border-[3px] border-[#1D1D1F] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] text-[#1D1D1F] pb-24" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10 relative z-10">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="font-extrabold text-[28px] sm:text-[36px] text-[#1D1D1F] tracking-tight leading-tight">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-[#5E6C84] text-[15px] font-medium">
            Monitor enrollments, view analytics, and manage users
          </p>
        </div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-10">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider mb-0.5">Students</p>
              <p className="text-[22px] font-black text-[#1D1D1F] leading-none">{studentCount}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider mb-0.5">Enrollments</p>
              <p className="text-[22px] font-black text-[#1D1D1F] leading-none">{registrations.length}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider mb-0.5">Waitlisted</p>
              <p className="text-[22px] font-black text-[#1D1D1F] leading-none">{totalWaitlisted}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider mb-0.5">Fill Rate</p>
              <p className="text-[22px] font-black text-[#1D1D1F] leading-none">
                {totalSeats > 0 ? Math.round((registeredSeats / totalSeats) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-transform hover:-translate-y-1 col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider mb-0.5">Total Seats</p>
              <p className="text-[22px] font-black text-[#1D1D1F] leading-none">{totalSeats}</p>
            </div>
          </div>
        </div>

        {/* Floating Glassy Pill Tabs */}
        <div className="flex justify-start mb-8 overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex p-1.5 bg-white/70 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white/90 shrink-0">
            {([
              { id: 'overview', label: 'Seat Overview' },
              { id: 'analytics', label: 'Analytics & Demand' },
              { id: 'users', label: `Enrolled Students` },
              { id: 'all-users', label: `All Users ${blockedCount > 0 ? `(${blockedCount} Blocked)` : ''}` }
            ] as const).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[#1D1D1F] text-white shadow-md'
                    : 'text-[#5E6C84] hover:text-[#1D1D1F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab 1: Seat Overview ── */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="font-extrabold text-[22px] text-[#1D1D1F] mb-6 tracking-tight">Live Seat Availability</h2>
            {events.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[36px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
                <p className="text-[#5E6C84] font-semibold text-[15px]">No workshops created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const fillPercentage = ((event.total_seats - event.available_seats) / event.total_seats) * 100;
                  const waitlistCount  = getWaitlistForEvent(event.id);
                  const isFull = event.available_seats <= 0;
                  
                  return (
                    <div key={event.id} className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_12px_40px_rgba(0,100,200,0.08)] hover:shadow-[0_18px_50px_rgba(0,100,200,0.12)] transition-all border border-white flex flex-col group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${event.type === 'Workshop' ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {event.type}
                        </span>
                        <div className="flex gap-2">
                          {event.is_mandatory && <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500 text-white">Mandatory</span>}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${event.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{event.status}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-extrabold text-[20px] text-[#1D1D1F] leading-tight tracking-tight mb-5 line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <div className="mt-auto space-y-3 pt-4 border-t border-black/5">
                        <div className="flex justify-between items-center text-[13px] font-bold">
                          <span className="text-[#5E6C84]">Enrolled</span>
                          <span className="text-[#1D1D1F]">{event.total_seats - event.available_seats} / {event.total_seats}</span>
                        </div>
                        
                        <div className="h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner border border-black/5">
                          <div className={`h-full rounded-full transition-all duration-1000 ${fillPercentage >= 90 ? 'bg-red-500' : fillPercentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${fillPercentage}%` }} />
                        </div>
                        
                        <div className="flex justify-between text-[12px] font-extrabold">
                          <span className="text-[#5E6C84]">Available</span>
                          <span className={`${isFull || event.available_seats <= 5 ? 'text-red-500' : 'text-[#38B2AC]'}`}>{event.available_seats} seats</span>
                        </div>
                        
                        {waitlistCount > 0 && (
                          <div className="flex justify-between text-[12px] font-extrabold">
                            <span className="text-amber-500">Waitlist</span>
                            <span className="text-amber-600">{waitlistCount} students</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Analytics ── */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="font-extrabold text-[22px] text-[#1D1D1F] mb-6 tracking-tight">Seat Utilization Analytics</h2>
            
            {analytics.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[36px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
                <p className="text-[#5E6C84] font-semibold text-[15px]">No analytics data available yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_12px_40px_rgba(0,100,200,0.08)] border border-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/50 backdrop-blur-md border-b border-black/5">
                          <th className="py-4 px-6 text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider">Workshop</th>
                          <th className="py-4 px-6 text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider text-center">Total Seats</th>
                          <th className="py-4 px-6 text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider text-center">Enrolled</th>
                          <th className="py-4 px-6 text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider text-center">Waitlist</th>
                          <th className="py-4 px-6 text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider text-center">Utilization</th>
                          <th className="py-4 px-6 text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wider text-center">Demand</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {analytics.map((item) => (
                          <tr key={item.eventId} className="hover:bg-white/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-[15px] text-[#1D1D1F]">{item.title}</span>
                                {item.isMandatory && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-600">Mandatory</span>}
                              </div>
                              <div className="text-[12px] font-medium text-[#5E6C84]">{item.type} • {item.date}</div>
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-[#1D1D1F]">{item.totalSeats}</td>
                            <td className="py-4 px-6 text-center font-bold text-emerald-600">{item.enrolledCount}</td>
                            <td className="py-4 px-6 text-center font-bold text-amber-600">{item.waitlistCount}</td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-16 h-2.5 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                                  <div className={`h-full rounded-full ${item.utilizationPercent >= 80 ? 'bg-red-500' : item.utilizationPercent >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${item.utilizationPercent}%` }} />
                                </div>
                                <span className="font-extrabold text-[#1D1D1F] text-[13px]">{item.utilizationPercent}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold ${getDemandColor(item.demandLevel)}`}>
                                {item.demandLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Demand Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(['High','Medium','Low'] as const).map(level => (
                    <div key={level} className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-6 shadow-[0_12px_40px_rgba(0,100,200,0.06)] border border-white">
                      <h3 className="text-[16px] font-extrabold text-[#1D1D1F] mb-4">{level === 'Low' ? 'Under-Utilized' : `${level} Demand`}</h3>
                      <div className="space-y-2.5">
                        {analytics.filter(a => a.demandLevel === level).length === 0
                          ? <p className="text-[13px] font-medium text-[#5E6C84]">No {level.toLowerCase()}-demand workshops</p>
                          : analytics.filter(a => a.demandLevel === level).map(a => (
                            <div key={a.eventId} className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F9FB] border border-black/5">
                              <span className="text-[13px] font-bold text-[#1D1D1F] truncate mr-2">{a.title}</span>
                              <span className={`text-[13px] font-extrabold shrink-0 ${level === 'High' ? 'text-red-600' : level === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{a.utilizationPercent}%</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Enrolled Students ── */}
        {activeTab === 'users' && (
          <div>
            <h2 className="font-extrabold text-[22px] text-[#1D1D1F] mb-6 tracking-tight">Active Students ({students.length})</h2>
            {students.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[36px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
                <p className="text-[#5E6C84] font-semibold text-[15px]">No students have registered yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => {
                  const userEvents = getUserRegistrations(student.id);
                  return (
                    <div key={student.id} className="bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white flex flex-col md:flex-row md:items-center gap-5 transition-transform hover:-translate-y-1">
                      <div className="w-14 h-14 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white font-extrabold text-[20px] shrink-0 shadow-sm">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[16px] text-[#1D1D1F] mb-1">{student.name}</h3>
                        <div className="flex items-center gap-2 text-[13px] font-medium text-[#5E6C84]">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[#1D1D1F] font-bold">{student.reg_no}</span>
                          <span>•</span>
                          <span className="truncate">{student.department}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 md:max-w-[40%]">
                        {userEvents.length > 0 ? userEvents.map(event => (
                          <span key={event?.id} className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold ${event?.type === 'Workshop' ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {event?.title}
                          </span>
                        )) : (
                          <span className="px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-gray-100 text-[#5E6C84]">No enrollments</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: All Users (Block/Unblock) ── */}
        {activeTab === 'all-users' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-extrabold text-[22px] text-[#1D1D1F] tracking-tight">
                User Management ({filteredStudents.length})
              </h2>
              {blockedCount > 0 && (
                <span className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-[13px] font-extrabold">
                  {blockedCount} Blocked Student{blockedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Block action message */}
            {blockMessage && (
              <div className={`mb-6 p-4 rounded-[20px] flex items-center justify-between gap-2 font-bold text-[14px] ${
                blockMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                <span>{blockMessage.text}</span>
                <button onClick={() => setBlockMessage(null)} className="opacity-60 hover:opacity-100 p-1">
                  ✕
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or reg number..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 text-[#1D1D1F] placeholder-[#86868B] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F] text-[15px] font-medium transition-all"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]">
                    ✕
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-2xl p-1.5 border border-white/80 shadow-sm overflow-x-auto custom-scrollbar">
                {allDepartments.map(dept => (
                  <button key={dept} onClick={() => setUserDeptFilter(dept)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${
                      userDeptFilter === dept
                        ? 'bg-[#1D1D1F] text-white shadow-sm'
                        : 'text-[#5E6C84] hover:text-[#1D1D1F] hover:bg-white/50'
                    }`}>
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* User List */}
            {filteredStudents.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-2xl rounded-[36px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
                <p className="text-[#5E6C84] font-semibold text-[15px]">No users found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => {
                  const userEvents     = getUserRegistrations(student.id);
                  const isExpanded     = expandedUser === student.id;
                  const isBlocked      = !!student.is_blocked;
                  const isBeingUpdated = blockingUserId === student.id;

                  return (
                    <div key={student.id} className={`bg-white/80 backdrop-blur-2xl rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] transition-all flex flex-col ${isBlocked ? 'border-2 border-red-500/30' : 'border border-white'}`}>
                      
                      {/* Main Row */}
                      <div className="flex flex-col md:flex-row md:items-center gap-5">
                        
                        <div className="relative shrink-0">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-[20px] shadow-sm ${
                            isBlocked ? 'bg-red-500' : 'bg-[#1D1D1F]'
                          }`}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          {isBlocked && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold text-[10px]">
                              ✕
                            </div>
                          )}
                        </div>

                        <div 
                          className="flex-1 min-w-0 cursor-pointer group"
                          onClick={() => setExpandedUser(isExpanded ? null : student.id)}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-extrabold text-[16px] text-[#1D1D1F] truncate group-hover:text-blue-600 transition-colors">{student.name}</h3>
                            {isBlocked && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-600 border border-red-500/20">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] font-medium text-[#5E6C84]">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[#1D1D1F] font-bold">{student.reg_no}</span>
                            <span>•</span>
                            <span className="truncate">{student.department}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 mt-3 md:mt-0">
                          <div className="text-center px-4 border-r border-black/5">
                            <p className="text-[18px] font-black text-[#1D1D1F] leading-none mb-1">{userEvents.length}</p>
                            <p className="text-[10px] font-extrabold text-[#86868B] uppercase tracking-wider">Enrolled</p>
                          </div>

                          <button
                            onClick={() => handleToggleBlock(student)}
                            disabled={isBeingUpdated}
                            className={`w-[100px] py-2.5 rounded-full text-[13px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                              isBlocked
                                ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-500/20'
                            }`}
                          >
                            {isBeingUpdated ? (
                              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : isBlocked ? (
                              'Unblock'
                            ) : (
                              'Block'
                            )}
                          </button>

                          <button onClick={() => setExpandedUser(isExpanded ? null : student.id)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <svg className={`w-5 h-5 text-[#1D1D1F] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-5 pt-5 border-t border-black/5">
                          {isBlocked && (
                            <div className="mb-4 p-4 rounded-[20px] bg-red-50/80 backdrop-blur-md border border-red-100 flex items-start gap-3">
                              <div className="text-red-500 mt-0.5">⚠️</div>
                              <p className="text-[13px] text-red-700 font-medium leading-relaxed">
                                This student's account is currently restricted. They can log in and view the dashboard, but are completely blocked from registering for any upcoming workshops or events.
                              </p>
                            </div>
                          )}

                          <p className="text-[13px] font-extrabold text-[#1D1D1F] mb-3">Enrolled Workshops</p>
                          {userEvents.length === 0 ? (
                            <p className="text-[13px] font-medium text-[#5E6C84]">Not enrolled in any workshops yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {userEvents.map(event => (
                                <div key={event.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-black/5">
                                  <span className="text-[12px] font-bold text-[#1D1D1F]">{event.title}</span>
                                  {event.is_mandatory && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;