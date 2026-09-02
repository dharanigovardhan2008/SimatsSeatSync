import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { subscribeToCoordinatorEvents, deleteEvent } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

export const CoordinatorDashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [events, setEvents] = useState<DocumentData[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCoordinatorEvents(user.uid, setEvents);
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this event? This also removes its registrations.')) return;
    await deleteEvent(eventId);
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
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

        {events.length === 0 ? (
          <Card>
            <p className="text-center text-[#6B7280]">
              You haven't created any events yet.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map((ev) => (
              <Card key={ev.id} hover={false}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-medium text-[#6C63FF] uppercase">{ev.type}</span>
                    <h3 className="font-display font-bold text-xl text-[#3D4852] mt-1">{ev.title}</h3>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {ev.date} · {ev.start_time}–{ev.end_time}
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      {ev.available_seats}/{ev.total_seats} seats left
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Link to={`/event/${ev.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">View</Button>
                  </Link>
                  <Link to={`/coordinator/events/${ev.id}/edit`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Edit</Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(ev.id!)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorDashboard;