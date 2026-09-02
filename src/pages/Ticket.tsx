import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
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
  const [downloading, setDownloading] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

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
        height: 55,
        displayValue: false,
        margin: 0,
      });
    }
  }, [registrationId, loading]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (time?: string) => {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    if (Number.isNaN(h)) return time;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes}${ampm}`;
  };

  // Download the ticket card as a PNG, matching what's rendered on screen.
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${(event?.title || 'ticket').replace(/\s+/g, '-').toLowerCase()}-ticket.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Could not generate ticket image:', err);
      // Fall back to browser print if canvas export fails (e.g. CORS-blocked image)
      window.print();
    } finally {
      setDownloading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-[#f4f1ee] via-[#f6ede4] to-[#efd9c8] flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 text-lg">Tickets</h1>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-11 h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700 disabled:opacity-50"
          aria-label="Download ticket"
        >
          {downloading ? (
            <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          )}
        </button>
      </div>

      {/* Ticket card */}
      <div className="max-w-md mx-auto w-full px-5 mt-4 pb-10">
        <div ref={ticketRef} className="rounded-[28px] overflow-hidden shadow-xl bg-white">
          {/* Hero image */}
          <div className="h-44 bg-gray-900 relative">
            {event.images?.[0] && (
              <img src={event.images[0]} alt="" crossOrigin="anonymous" className="w-full h-full object-cover opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 text-white font-bold text-xl leading-snug drop-shadow">
              {event.title}
            </div>
          </div>

          {/* Perforated divider with notch cut-outs */}
          <div className="relative h-0">
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
            <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-gray-200" />
          </div>

          {/* Details */}
          <div className="p-6 pt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                {event.type || 'Event'}
              </span>
              <span className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                </svg>
              </span>
            </div>

            <h2 className="font-bold text-xl text-gray-900">{event.title}</h2>
            {event.about && <p className="text-sm text-gray-500 mt-1">{event.about.slice(0, 70)}</p>}

            <div className="grid grid-cols-2 gap-y-5 mt-6 text-sm">
              <div>
                <p className="text-gray-400">Date</p>
                <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="text-gray-400">Time</p>
                <p className="font-medium text-gray-900">{formatTime(event.start_time)}</p>
              </div>
              <div>
                <p className="text-gray-400">Location</p>
                <p className="font-medium text-gray-900">{event.location?.address || 'On campus'}</p>
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

            {/* Second perforated divider before barcode */}
            <div className="relative my-6">
              <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
              <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
              <div className="border-t-2 border-dashed border-gray-200" />
            </div>

            <div className="flex justify-center">
              <svg ref={barcodeRef} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">Show this ticket at registration</p>
      </div>
    </div>
  );
};

export default Ticket;