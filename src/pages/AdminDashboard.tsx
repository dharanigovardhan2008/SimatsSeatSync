// Admin Dashboard Page - Enhanced with Analytics, Demand Insights, Compliance Tracking, Users, and Block/Unblock
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { 
  subscribeToUsers, 
  subscribeToEvents, 
  subscribeToRegistrations,
  subscribeToWaitlist,
  getEventAnalytics,
  getComplianceStatus,
  blockUser,
  unblockUser,
  type EventAnalytics,
  type ComplianceStatus
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
  const [compliance, setCompliance] = useState<ComplianceStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'all-users' | 'compliance'>('overview');

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
        const [analyticsData, complianceData] = await Promise.all([
          getEventAnalytics(),
          getComplianceStatus()
        ]);
        setAnalytics(analyticsData);
        setCompliance(complianceData);
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

  const getComplianceForUser = (userId: string) =>
    compliance.find(c => c.userId === userId);

  const totalSeats        = events.reduce((acc, e) => acc + e.total_seats, 0);
  const registeredSeats   = events.reduce((acc, e) => acc + (e.total_seats - e.available_seats), 0);
  const studentCount      = users.filter(u => u.role === 'student').length;
  const totalWaitlisted   = waitlist.length;
  const compliantStudents = compliance.filter(c => c.isCompliant).length;

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'High':   return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low':    return 'bg-green-100 text-green-700';
      default:       return 'bg-gray-100 text-gray-700';
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
        <div className="mb-12">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-[#3D4852] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-3 text-[#6B7280] text-lg">
            Monitor enrollments, analytics, and academic compliance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card hover={false} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Students</p>
              <p className="text-2xl font-bold text-[#3D4852]">{studentCount}</p>
            </div>
          </Card>

          <Card hover={false} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#38B2AC] to-[#4FD1C5] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Enrollments</p>
              <p className="text-2xl font-bold text-[#3D4852]">{registrations.length}</p>
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
              <p className="text-2xl font-bold text-[#3D4852]">{totalWaitlisted}</p>
            </div>
          </Card>

          <Card hover={false} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FC8181] to-[#F56565] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Seat Fill Rate</p>
              <p className="text-2xl font-bold text-[#3D4852]">
                {totalSeats > 0 ? Math.round((registeredSeats / totalSeats) * 100) : 0}%
              </p>
            </div>
          </Card>

          <Card hover={false} className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] ${
              compliantStudents === studentCount && studentCount > 0
                ? 'bg-gradient-to-br from-[#38B2AC] to-[#4FD1C5]'
                : 'bg-gradient-to-br from-[#FC8181] to-[#F56565]'
            }`}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Compliant</p>
              <p className="text-2xl font-bold text-[#3D4852]">{compliantStudents}/{studentCount}</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          {(['overview', 'analytics', 'users', 'all-users', 'compliance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === tab
                  ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                  : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
              }`}
            >
              {tab === 'overview'   && 'Seat Overview'}
              {tab === 'analytics'  && 'Analytics & Demand'}
              {tab === 'users'      && 'Enrolled Students'}
              {tab === 'all-users'  && (
                <>
                  All Users
                  {blockedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">{blockedCount}</span>
                  )}
                </>
              )}
              {tab === 'compliance' && (
                <>
                  Compliance Tracking
                  {compliantStudents < studentCount && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* ── Seat Overview ── */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">Live Seat Availability</h2>
            {events.length === 0 ? (
              <Card hover={false} className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] mb-6">
                  <svg className="w-10 h-10 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#3D4852] mb-2">No workshops created yet</h3>
                <p className="text-[#6B7280]">Go to Events to create your first workshop</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const fillPercentage = ((event.total_seats - event.available_seats) / event.total_seats) * 100;
                  const waitlistCount  = getWaitlistForEvent(event.id);
                  return (
                    <Card key={event.id} className="relative overflow-hidden">
                      <div className="absolute top-4 right-4 flex gap-2">
                        {event.is_mandatory && <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">Mandatory</span>}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.status === 'Upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{event.status}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.type === 'Workshop' ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : 'bg-[#38B2AC]/10 text-[#38B2AC]'}`}>{event.type}</span>
                      <h3 className="font-display font-bold text-xl text-[#3D4852] mt-3 mb-4">{event.title}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#6B7280]">Enrolled</span>
                          <span className="font-bold text-[#3D4852]">{event.total_seats - event.available_seats} / {event.total_seats}</span>
                        </div>
                        <div className="h-4 rounded-full bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${fillPercentage >= 90 ? 'bg-gradient-to-r from-red-500 to-red-400' : fillPercentage >= 70 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 'bg-gradient-to-r from-[#38B2AC] to-[#4FD1C5]'}`}
                            style={{ width: `${fillPercentage}%` }} />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">Available</span>
                          <span className={`font-medium ${event.available_seats <= 5 ? 'text-red-500' : 'text-[#38B2AC]'}`}>{event.available_seats} seats</span>
                        </div>
                        {waitlistCount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F6AD55]">Waitlist</span>
                            <span className="font-medium text-[#F6AD55]">{waitlistCount} students</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">Seat Utilization Analytics & Demand Insights</h2>
            {analytics.length === 0 ? (
              <Card hover={false} className="text-center py-16"><p className="text-[#6B7280]">No analytics data available</p></Card>
            ) : (
              <div className="overflow-x-auto">
                <Card hover={false} className="p-0 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#E0E5EC]">
                      <tr>
                        {['Workshop','Total Seats','Enrolled','Waitlisted','Utilization','Demand Level'].map(h => (
                          <th key={h} className={`py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider ${h === 'Workshop' ? 'text-left' : 'text-center'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E5EC]">
                      {analytics.map((item) => (
                        <tr key={item.eventId} className="hover:bg-[#E0E5EC]/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#3D4852]">{item.title}</span>
                              {item.isMandatory && <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">Mandatory</span>}
                            </div>
                            <span className="text-sm text-[#6B7280]">{item.type} • {item.date}</span>
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-[#3D4852]">{item.totalSeats}</td>
                          <td className="py-4 px-6 text-center font-medium text-[#38B2AC]">{item.enrolledCount}</td>
                          <td className="py-4 px-6 text-center font-medium text-[#F6AD55]">{item.waitlistCount}</td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-[#E0E5EC] overflow-hidden">
                                <div className={`h-full rounded-full ${item.utilizationPercent >= 80 ? 'bg-gradient-to-r from-red-500 to-red-400' : item.utilizationPercent >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-green-500 to-green-400'}`}
                                  style={{ width: `${item.utilizationPercent}%` }} />
                              </div>
                              <span className="font-medium text-[#3D4852]">{item.utilizationPercent}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDemandColor(item.demandLevel)}`}>{item.demandLevel}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {(['High','Medium','Low'] as const).map(level => (
                <Card key={level} hover={false}>
                  <h3 className="text-lg font-bold text-[#3D4852] mb-4">{level === 'Low' ? 'Under-Utilized' : `${level} Demand`}</h3>
                  <div className="space-y-2">
                    {analytics.filter(a => a.demandLevel === level).length === 0
                      ? <p className="text-sm text-[#6B7280]">No {level.toLowerCase()}-demand workshops</p>
                      : analytics.filter(a => a.demandLevel === level).map(a => (
                        <div key={a.eventId} className={`flex items-center justify-between p-2 rounded-xl ${level === 'High' ? 'bg-red-50' : level === 'Medium' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                          <span className="text-sm font-medium text-[#3D4852]">{a.title}</span>
                          <span className={`text-xs ${level === 'High' ? 'text-red-600' : level === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>{a.utilizationPercent}%</span>
                        </div>
                      ))
                    }
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Enrolled Students ── */}
        {activeTab === 'users' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">Enrolled Students ({students.length})</h2>
            {students.length === 0 ? (
              <Card hover={false} className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] mb-6">
                  <svg className="w-10 h-10 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#3D4852] mb-2">No students registered yet</h3>
                <p className="text-[#6B7280]">Students will appear here once they register</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {students.map((student) => {
                  const userEvents = getUserRegistrations(student.id);
                  return (
                    <Card key={student.id} className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center text-white font-bold text-xl shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#3D4852]">{student.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B7280]">
                          <span>Reg: {student.reg_no}</span><span>•</span><span>{student.department}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userEvents.length > 0 ? userEvents.map(event => (
                          <span key={event?.id} className={`px-3 py-1 rounded-full text-xs font-medium ${event?.type === 'Workshop' ? 'bg-[#6C63FF]/10 text-[#6C63FF]' : 'bg-[#38B2AC]/10 text-[#38B2AC]'}`}>{event?.title}</span>
                        )) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No enrollments</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ALL USERS (with Block/Unblock) ── */}
        {activeTab === 'all-users' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="font-display font-bold text-2xl text-[#3D4852]">
                All Users ({filteredStudents.length} of {studentCount})
              </h2>
              {blockedCount > 0 && (
                <span className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 text-red-600 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  {blockedCount} blocked student{blockedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Block action message */}
            {blockMessage && (
              <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-2 ${
                blockMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              } shadow-[inset_3px_3px_6px_rgba(0,0,0,0.05),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]`}>
                <span className="text-sm">{blockMessage.text}</span>
                <button onClick={() => setBlockMessage(null)} className="opacity-60 hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Search + Department filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or reg number..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#E0E5EC] text-[#3D4852] placeholder-[#9CA3AF] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#3D4852]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 bg-[#E0E5EC] rounded-2xl p-1 shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] overflow-x-auto">
                {allDepartments.map(dept => (
                  <button key={dept} onClick={() => setUserDeptFilter(dept)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      userDeptFilter === dept
                        ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[3px_3px_6px_rgb(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.4)]'
                        : 'text-[#6B7280] hover:text-[#3D4852]'
                    }`}>
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* User cards */}
            {filteredStudents.length === 0 ? (
              <Card hover={false} className="text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[inset_4px_4px_8px_rgb(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] mb-4">
                  <svg className="w-8 h-8 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-[#3D4852] font-medium mb-1">No users found</p>
                <p className="text-sm text-[#6B7280]">Try adjusting your search or department filter</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const userEvents     = getUserRegistrations(student.id);
                  const userCompliance = getComplianceForUser(student.id);
                  const isExpanded     = expandedUser === student.id;
                  const isBlocked      = !!student.is_blocked;
                  const isBeingUpdated = blockingUserId === student.id;

                  return (
                    <Card key={student.id} hover={false} className={`overflow-hidden transition-all duration-200 ${isBlocked ? 'border border-red-200' : ''}`}>
                      {/* Main row */}
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Avatar + blocked indicator */}
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.5)] ${
                            isBlocked
                              ? 'bg-gradient-to-br from-red-400 to-red-500'
                              : 'bg-gradient-to-br from-[#6C63FF] to-[#8B84FF]'
                          }`}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          {isBlocked && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Name + info */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setExpandedUser(isExpanded ? null : student.id)}
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#3D4852] truncate">{student.name}</h3>
                            {isBlocked && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 flex-shrink-0">
                                Blocked
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 text-sm text-[#6B7280]">
                            <span>{student.reg_no}</span>
                            <span>•</span>
                            <span>{student.department}</span>
                          </div>
                        </div>

                        {/* Quick stats + actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Enrolled count */}
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#6C63FF]">{userEvents.length}</p>
                            <p className="text-xs text-[#6B7280]">Enrolled</p>
                          </div>

                          {/* Compliance badge */}
                          {userCompliance && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              userCompliance.isCompliant
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {userCompliance.isCompliant ? '✓ Compliant' : `${userCompliance.compliancePercent}%`}
                            </span>
                          )}

                          {/* Block / Unblock button */}
                          <button
                            onClick={() => handleToggleBlock(student)}
                            disabled={isBeingUpdated}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isBlocked
                                ? 'bg-green-50 text-green-600 hover:bg-green-100 shadow-[3px_3px_6px_rgb(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.5)]'
                                : 'bg-red-50 text-red-500 hover:bg-red-100 shadow-[3px_3px_6px_rgb(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.5)]'
                            }`}
                          >
                            {isBeingUpdated ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : isBlocked ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Unblock
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                Block
                              </>
                            )}
                          </button>

                          {/* Expand chevron */}
                          <button onClick={() => setExpandedUser(isExpanded ? null : student.id)}>
                            <svg className={`w-5 h-5 text-[#6B7280] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#E0E5EC] space-y-4">
                          {/* Block status explanation */}
                          {isBlocked && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              <p className="text-sm text-red-700">
                                This student is <strong>blocked</strong>. They can still log in but cannot register for any workshops until unblocked.
                              </p>
                            </div>
                          )}

                          {/* Enrolled Workshops */}
                          <div>
                            <p className="text-sm font-medium text-[#3D4852] mb-2">Enrolled Workshops ({userEvents.length})</p>
                            {userEvents.length === 0 ? (
                              <p className="text-sm text-[#6B7280]">Not enrolled in any workshops</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {userEvents.map(event => (
                                  <div key={event.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C63FF]/10">
                                    <span className="text-xs font-medium text-[#6C63FF]">{event.title}</span>
                                    {event.is_mandatory && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Compliance detail */}
                          {userCompliance && (
                            <div>
                              <p className="text-sm font-medium text-[#3D4852] mb-2">
                                Compliance — {userCompliance.completedMandatory}/{userCompliance.totalMandatory} mandatory workshops completed
                              </p>
                              <div className="h-2 rounded-full bg-[#E0E5EC] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] overflow-hidden mb-3">
                                <div className={`h-full rounded-full ${
                                  userCompliance.compliancePercent === 100 ? 'bg-gradient-to-r from-green-500 to-green-400'
                                  : userCompliance.compliancePercent >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400'
                                }`} style={{ width: `${userCompliance.compliancePercent}%` }} />
                              </div>
                              {userCompliance.pendingWorkshops.length > 0 && (
                                <div>
                                  <p className="text-xs text-[#6B7280] mb-1">Pending mandatory workshops:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {userCompliance.pendingWorkshops.map(w => (
                                      <span key={w} className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600">{w}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Compliance Tracking ── */}
        {activeTab === 'compliance' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">Academic Compliance Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Compliant', value: compliantStudents, color: 'from-[#38B2AC] to-[#4FD1C5]', sub: 'Students meeting all requirements' },
                { label: 'Pending', value: studentCount - compliantStudents, color: 'from-[#FC8181] to-[#F56565]', sub: 'Students with incomplete requirements' },
                { label: 'Overall Compliance', value: `${studentCount > 0 ? Math.round((compliantStudents / studentCount) * 100) : 0}%`, color: 'from-[#6C63FF] to-[#8B84FF]', sub: 'Institution compliance rate' },
              ].map(item => (
                <Card key={item.label} hover={false} className="text-center">
                  <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] mb-4`}>
                    <span className="text-2xl font-bold text-white">{item.value}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#3D4852]">{item.label}</h3>
                  <p className="text-sm text-[#6B7280]">{item.sub}</p>
                </Card>
              ))}
            </div>

            {compliance.length === 0 ? (
              <Card hover={false} className="text-center py-16"><p className="text-[#6B7280]">No compliance data available</p></Card>
            ) : (
              <Card hover={false} className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#E0E5EC]">
                      <tr>
                        {['Student','Department','Completed','Pending','Progress','Status'].map(h => (
                          <th key={h} className={`py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider ${h === 'Student' || h === 'Department' ? 'text-left' : 'text-center'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E5EC]">
                      {compliance.map((student) => (
                        <tr key={student.userId} className="hover:bg-[#E0E5EC]/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center text-white font-bold">
                                {student.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-[#3D4852]">{student.userName}</p>
                                <p className="text-sm text-[#6B7280]">{student.regNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[#6B7280]">{student.department}</td>
                          <td className="py-4 px-6 text-center font-medium text-[#38B2AC]">{student.completedMandatory}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-medium text-[#FC8181]">{student.pendingMandatory}</span>
                            {student.pendingWorkshops.length > 0 && (
                              <p className="text-xs text-[#6B7280] mt-1">
                                {student.pendingWorkshops.slice(0, 2).join(', ')}
                                {student.pendingWorkshops.length > 2 && '...'}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-[#E0E5EC] overflow-hidden">
                                <div className={`h-full rounded-full ${student.compliancePercent === 100 ? 'bg-gradient-to-r from-green-500 to-green-400' : student.compliancePercent >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                                  style={{ width: `${student.compliancePercent}%` }} />
                              </div>
                              <span className="text-sm font-medium text-[#3D4852]">{student.compliancePercent}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${student.isCompliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {student.isCompliant ? 'Compliant' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
