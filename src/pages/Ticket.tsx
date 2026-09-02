import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import { useAuth } from '@/context/AuthContext';
import { getRegistrationById, getEventById } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

export const Ticket: React.FC = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [registration, setRegistration] = useState<DocumentData | null>(null);
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!registrationId) return;
    (async () => {
      const reg = await getRegistrationById(registrationId);
      setRegistration(reg);
      if (reg?.event_id) {
        const ev = await getEventById(reg.event_id);
        setEvent(ev);
      }
      setLoading(false);
    })();
  }, [registrationId]);

  useEffect(() => {
    if (barcodeRef.current && registrationId) {
      JsBarcode(barcodeRef.current, registrationId, {
        format: 'CODE128',
        width: 1.6,
        height: 60,
        displayValue: false,
        margin: 0,
      });
    }
  }, [registrationId, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!registration || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        Ticket not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">←</button>
        <h1 className="font-semibold text-gray-900">Tickets</h1>
        <button onClick={() => window.print()} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">⬇</button>
      </div>

      <div className="max-w-md mx-auto w-full px-5 mt-6">
        <div className="rounded-3xl overflow-hidden shadow-xl bg-white">
          <div className="h-40 bg-gray-900 relative">
            {event.images?.[0] && (
              <img src={event.images[0]} alt="" className="w-full h-full object-cover opacity-90" />
            )}
            <div className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow">
              {event.title}
            </div>
          </div>

          <div className="p-6">
            <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1 mb-3">
              {event.type}
            </span>
            <h2 className="font-bold text-xl text-gray-900">{event.title}</h2>
            {event.about && <p className="text-sm text-gray-500 mt-1">{event.about.slice(0, 60)}</p>}

            <div className="grid grid-cols-2 gap-y-4 mt-6 text-sm">
              <div>
                <p className="text-gray-400">Date</p>
                <p className="font-medium text-gray-900">{event.date}</p>
              </div>
              <div>
                <p className="text-gray-400">Time</p>
                <p className="font-medium text-gray-900">{event.start_time}</p>
              </div>
              <div>
                <p className="text-gray-400">Location</p>
                <p className="font-medium text-gray-900">{event.location?.address || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400">Seats</p>
                <p className="font-medium text-gray-900">General Admission</p>
              </div>
              <div>
                <p className="text-gray-400">Ticket holder</p>
                <p className="font-medium text-gray-900">{userData?.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Issued to</p>
                <p className="font-medium text-gray-900">ID: {userData?.reg_no}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-6" />

            <div className="flex justify-center">
              <svg ref={barcodeRef} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Show at Registration</p>
      </div>
    </div>
  );
};

export default Ticket;