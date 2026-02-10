// Admin Dashboard Page - Enhanced with Analytics, Demand Insights, and Compliance Tracking
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
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'compliance'>('overview');

  // Redirect if not logged in or not an admin
  useEffect(() => {
    if (!authLoading && (!user || !userData)) {
      navigate('/login');
    } else if (!authLoading && userData && userData.role !== 'admin') {
      navigate('/student');
    }
  }, [user, userData, authLoading, navigate]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubUsers = subscribeToUsers((data: DocumentData[]) => {
      setUsers(data as UserData[]);
    });

    const unsubEvents = subscribeToEvents((data: DocumentData[]) => {
      setEvents(data as EventData[]);
    });

    const unsubRegs = subscribeToRegistrations((data: DocumentData[]) => {
      setRegistrations(data as RegistrationData[]);
    });

    const unsubWaitlist = subscribeToWaitlist((data: DocumentData[]) => {
      setWaitlist(data as WaitlistData[]);
    });

    return () => {
      unsubUsers();
      unsubEvents();
      unsubRegs();
      unsubWaitlist();
    };
  }, []);

  // Fetch analytics and compliance data
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
  }, [registrations, waitlist]); // Refresh when registrations change

  const getUserRegistrations = (userId: string) => {
    const userRegs = registrations.filter(r => r.user_id === userId);
    return userRegs.map(r => events.find(e => e.id === r.event_id)).filter(Boolean);
  };

  const getWaitlistForEvent = (eventId: string) => {
    return waitlist.filter(w => w.event_id === eventId).length;
  };

  const totalSeats = events.reduce((acc, e) => acc + e.total_seats, 0);
  const registeredSeats = events.reduce((acc, e) => acc + (e.total_seats - e.available_seats), 0);
  const studentCount = users.filter(u => u.role === 'student').length;
  const totalWaitlisted = waitlist.length;
  const compliantStudents = compliance.filter(c => c.isCompliant).length;

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
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
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              activeTab === 'overview'
                ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            Seat Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              activeTab === 'analytics'
                ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            Analytics & Demand
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              activeTab === 'users'
                ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            Enrolled Students
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'compliance'
                ? 'text-white bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]'
                : 'text-[#6B7280] bg-[#E0E5EC] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            Compliance Tracking
            {compliantStudents < studentCount && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              Live Seat Availability
            </h2>

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
                  const waitlistCount = getWaitlistForEvent(event.id);
                  
                  return (
                    <Card key={event.id} className="relative overflow-hidden">
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        {event.is_mandatory && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            Mandatory
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'Upcoming'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {event.status}
                        </span>
                      </div>

                      {/* Event Type */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.type === 'Workshop'
                          ? 'bg-[#6C63FF]/10 text-[#6C63FF]'
                          : 'bg-[#38B2AC]/10 text-[#38B2AC]'
                      }`}>
                        {event.type}
                      </span>

                      {/* Title */}
                      <h3 className="font-display font-bold text-xl text-[#3D4852] mt-3 mb-4">
                        {event.title}
                      </h3>

                      {/* Seat Info */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#6B7280]">Enrolled</span>
                          <span className="font-bold text-[#3D4852]">
                            {event.total_seats - event.available_seats} / {event.total_seats}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-4 rounded-full bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              fillPercentage >= 90
                                ? 'bg-gradient-to-r from-red-500 to-red-400'
                                : fillPercentage >= 70
                                ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                                : 'bg-gradient-to-r from-[#38B2AC] to-[#4FD1C5]'
                            }`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">Available</span>
                          <span className={`font-medium ${
                            event.available_seats <= 5 ? 'text-red-500' : 'text-[#38B2AC]'
                          }`}>
                            {event.available_seats} seats
                          </span>
                        </div>

                        {waitlistCount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#F6AD55]">Waitlist</span>
                            <span className="font-medium text-[#F6AD55]">
                              {waitlistCount} students
                            </span>
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

        {activeTab === 'analytics' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              Seat Utilization Analytics & Demand Insights
            </h2>

            {analytics.length === 0 ? (
              <Card hover={false} className="text-center py-16">
                <p className="text-[#6B7280]">No analytics data available</p>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <Card hover={false} className="p-0 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#E0E5EC]">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Workshop</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Total Seats</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Enrolled</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Waitlisted</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Utilization</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Demand Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E5EC]">
                      {analytics.map((item) => (
                        <tr key={item.eventId} className="hover:bg-[#E0E5EC]/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#3D4852]">{item.title}</span>
                              {item.isMandatory && (
                                <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">
                                  Mandatory
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-[#6B7280]">{item.type} • {item.date}</span>
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-[#3D4852]">
                            {item.totalSeats}
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-[#38B2AC]">
                            {item.enrolledCount}
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-[#F6AD55]">
                            {item.waitlistCount}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-[#E0E5EC] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.utilizationPercent >= 80
                                      ? 'bg-gradient-to-r from-red-500 to-red-400'
                                      : item.utilizationPercent >= 50
                                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                      : 'bg-gradient-to-r from-green-500 to-green-400'
                                  }`}
                                  style={{ width: `${item.utilizationPercent}%` }}
                                />
                              </div>
                              <span className="font-medium text-[#3D4852]">{item.utilizationPercent}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDemandColor(item.demandLevel)}`}>
                              {item.demandLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card hover={false}>
                <h3 className="text-lg font-bold text-[#3D4852] mb-4">High Demand</h3>
                <div className="space-y-2">
                  {analytics.filter(a => a.demandLevel === 'High').length === 0 ? (
                    <p className="text-sm text-[#6B7280]">No high-demand workshops</p>
                  ) : (
                    analytics.filter(a => a.demandLevel === 'High').map(a => (
                      <div key={a.eventId} className="flex items-center justify-between p-2 rounded-xl bg-red-50">
                        <span className="text-sm font-medium text-[#3D4852]">{a.title}</span>
                        <span className="text-xs text-red-600">{a.utilizationPercent}%</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-bold text-[#3D4852] mb-4">Medium Demand</h3>
                <div className="space-y-2">
                  {analytics.filter(a => a.demandLevel === 'Medium').length === 0 ? (
                    <p className="text-sm text-[#6B7280]">No medium-demand workshops</p>
                  ) : (
                    analytics.filter(a => a.demandLevel === 'Medium').map(a => (
                      <div key={a.eventId} className="flex items-center justify-between p-2 rounded-xl bg-yellow-50">
                        <span className="text-sm font-medium text-[#3D4852]">{a.title}</span>
                        <span className="text-xs text-yellow-600">{a.utilizationPercent}%</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card hover={false}>
                <h3 className="text-lg font-bold text-[#3D4852] mb-4">Under-Utilized</h3>
                <div className="space-y-2">
                  {analytics.filter(a => a.demandLevel === 'Low').length === 0 ? (
                    <p className="text-sm text-[#6B7280]">No under-utilized workshops</p>
                  ) : (
                    analytics.filter(a => a.demandLevel === 'Low').map(a => (
                      <div key={a.eventId} className="flex items-center justify-between p-2 rounded-xl bg-green-50">
                        <span className="text-sm font-medium text-[#3D4852]">{a.title}</span>
                        <span className="text-xs text-green-600">{a.utilizationPercent}%</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              Enrolled Students ({users.filter(u => u.role === 'student').length})
            </h2>

            {users.filter(u => u.role === 'student').length === 0 ? (
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
                {users.filter(u => u.role === 'student').map((student) => {
                  const userEvents = getUserRegistrations(student.id);
                  
                  return (
                    <Card key={student.id} className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center text-white font-bold text-xl shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
                        {student.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-[#3D4852]">{student.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B7280]">
                          <span>Reg: {student.reg_no}</span>
                          <span>•</span>
                          <span>{student.department}</span>
                        </div>
                      </div>

                      {/* Registered Events */}
                      <div className="flex flex-wrap gap-2">
                        {userEvents.length > 0 ? (
                          userEvents.map((event) => (
                            <span 
                              key={event?.id}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                event?.type === 'Workshop'
                                  ? 'bg-[#6C63FF]/10 text-[#6C63FF]'
                                  : 'bg-[#38B2AC]/10 text-[#38B2AC]'
                              }`}
                            >
                              {event?.title}
                            </span>
                          ))
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            No enrollments
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div>
            <h2 className="font-display font-bold text-2xl text-[#3D4852] mb-6">
              Academic Compliance Tracking
            </h2>

            {/* Compliance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card hover={false} className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#38B2AC] to-[#4FD1C5] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] mb-4">
                  <span className="text-2xl font-bold text-white">{compliantStudents}</span>
                </div>
                <h3 className="text-lg font-bold text-[#3D4852]">Compliant</h3>
                <p className="text-sm text-[#6B7280]">Students meeting all requirements</p>
              </Card>

              <Card hover={false} className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FC8181] to-[#F56565] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] mb-4">
                  <span className="text-2xl font-bold text-white">{studentCount - compliantStudents}</span>
                </div>
                <h3 className="text-lg font-bold text-[#3D4852]">Pending</h3>
                <p className="text-sm text-[#6B7280]">Students with incomplete requirements</p>
              </Card>

              <Card hover={false} className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] mb-4">
                  <span className="text-2xl font-bold text-white">
                    {studentCount > 0 ? Math.round((compliantStudents / studentCount) * 100) : 0}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#3D4852]">Overall Compliance</h3>
                <p className="text-sm text-[#6B7280]">Institution compliance rate</p>
              </Card>
            </div>

            {/* Student Compliance List */}
            {compliance.length === 0 ? (
              <Card hover={false} className="text-center py-16">
                <p className="text-[#6B7280]">No compliance data available</p>
              </Card>
            ) : (
              <Card hover={false} className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#E0E5EC]">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Student</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Department</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Completed</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Pending</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Progress</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
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
                          <td className="py-4 px-6 text-center font-medium text-[#38B2AC]">
                            {student.completedMandatory}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div>
                              <span className="font-medium text-[#FC8181]">{student.pendingMandatory}</span>
                              {student.pendingWorkshops.length > 0 && (
                                <p className="text-xs text-[#6B7280] mt-1">
                                  {student.pendingWorkshops.slice(0, 2).join(', ')}
                                  {student.pendingWorkshops.length > 2 && '...'}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-[#E0E5EC] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    student.compliancePercent === 100
                                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                                      : student.compliancePercent >= 50
                                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                      : 'bg-gradient-to-r from-red-500 to-red-400'
                                  }`}
                                  style={{ width: `${student.compliancePercent}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-[#3D4852]">{student.compliancePercent}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              student.isCompliant 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
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
