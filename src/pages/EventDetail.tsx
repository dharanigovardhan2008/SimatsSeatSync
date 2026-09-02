import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getEventById, registerForEvent } from '@/lib/firebase';
import { EventMap } from '@/components/events/EventMap';
import type { DocumentData } from 'firebase/firestore';

export const EventDetail: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then((ev) => {
      setEvent(ev);
      setLoading(false);
    });
  }, [eventId]);

  const handleGetTicket = async () => {
    if (!userData || !eventId) return;
    setError('');
    setRegistering(true);
    try {
      const result = await registerForEvent(userData.id, eventId, userData.department);
      if (result.status === 'registered' && result.registrationId) {
        navigate(`/ticket/${result.registrationId}`);
      } else {
        setError('The event is full — you have been added to the waitlist.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not register for this event');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        Event not found.
      </div>
    );
  }

  const heroImage = event.images?.[0];

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-32">
      {/* Hero */}
      <div className="relative">
        <div className="h-64 w-full overflow-hidden bg-gray-900">
          {heroImage ? (
            <img src={heroImage} alt={event.title} className="w-full h-full object-cover opacity-90" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow"
        >
          ←
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          {event.location?.address && (
            <div className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1 mb-3">
              📍 {event.location.address}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {event.date} · {event.start_time}–{event.end_time}
          </p>
        </div>

        {/* About */}
        {event.about && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mt-4">
            <h2 className="font-bold text-lg text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {expanded || event.about.length <= 160 ? event.about : `${event.about.slice(0, 160)}…`}
              {event.about.length > 160 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-gray-900 font-semibold ml-1"
                >
                  {expanded ? 'Show less' : 'Read More'}
                </button>
              )}
            </p>
          </div>
        )}

        {/* Timeline */}
        {event.timeline?.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mt-4">
            <h2 className="font-bold text-lg text-gray-900 mb-3">Timeline Event</h2>
            <div className="space-y-3">
              {event.timeline.map((row: { time: string; title: string }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{row.title} :</span>
                  <span className="text-gray-500">{row.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {event.location?.lat && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mt-4">
            <h2 className="font-bold text-lg text-gray-900 mb-3">Location</h2>
            <EventMap lat={event.location.lat} lng={event.location.lng} label={event.title} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm">{error}</div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Starting from</p>
            <p className="text-lg font-bold text-gray-900">
              {event.registration_fee ? `₹${event.registration_fee}` : 'Free'}
            </p>
          </div>
          <button
            onClick={handleGetTicket}
            disabled={registering || event.available_seats <= 0}
            className="flex-1 max-w-xs bg-black text-white rounded-full py-3 font-semibold disabled:opacity-50"
          >
            {registering ? 'Booking…' : event.available_seats > 0 ? 'Get a Ticket' : 'Join Waitlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;